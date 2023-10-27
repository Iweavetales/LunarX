import React, { useContext, useEffect, useRef, useState } from "react"
import { UniversalRouteInfoNode } from "~/core/document-types"
import { Location, UrlStringToURLComponents } from "~/core/location"
import { RootAppContext, useRouteShardPreparing } from "./root-app-context"
import {
  AppRoutingContext,
  BeforeRoutingHandler,
  NavigateOptions,
  PrepareForNavigate,
} from "./router-context"
import { graftRouteNodesToRouteTree } from "./graft-route-nodes-to-route-tree"
import { ShardPath } from "~/core/manifest"
import { ProductionMode } from "../../../node-runtime/lib/constants"

function isOutboundHref(href: string) {
  /**
   * preprocessing routing destination
   */
  if (href.startsWith("/")) {
    // nothing to do in here
    return false
  } else if (href.startsWith("#")) {
    // will change hash
    location.href = href
    return false
  } else if (href.startsWith("?")) {
    // same destination path routing
    return false
  } else {
    return true
  }
}

export function AppRoutingProvider(props: {
  children: React.ReactNode
  enterRouteNodeList: UniversalRouteInfoNode[]
  enterLocation: Location
  enterRouteData: { [pattern: string]: any }
}) {
  const rootCtx = useContext(RootAppContext)
  const prepareRouteShards = useRouteShardPreparing()
  const [browsing, setBrowsing] = useState(false)
  const [beforeRoutingListeners, setBeforeRoutingListeners] = useState<{
    [id: string]: BeforeRoutingHandler | null
  }>({})

  const [routeTree, setRouteTree] = useState(
    graftRouteNodesToRouteTree(props.enterRouteNodeList, [])[0]
  )
  const [currentRouteDataMap, setCurrentRouteDataMap] = useState(
    props.enterRouteData
  )

  /**
   * 스크롤이 되는 동안은 스크롤 기억(replaceState) 를 지연시키기 위해 사용되는 timeout ID ref
   * replaceState 가 30초 안에 100번이 발생 하면 네비게이팅이 제대로 동작 하지 않기 때문에(iOS 사파리에서 에러 발생)
   * 유저가 스크롤을 함으로 해서 scroll 좌표가 변할 때 마다 기록하지 않고
   * 스크롤이 멈췄을 때 마지막으로 scroll 좌표를 기억 하기 위한 timeoutId reference 이다
   */
  const scrollMemorizeTimeoutIdRef = useRef<number | null>(null)

  /**
   * 실제 랜더링 될 라우트를 결정 하는 로케이션 객체
   * navigate 할 때 마다 로딩이 완료되면 수정된다
   *
   * ❗💡💡 이 상태값이 react-router 에 전달 되어 react-router 가 해당하는 라우트 계층을 랜더링 한다. 💡💡❗
   */
  const [currentLocation, setCurrentLocation] = useState<
    { auto: boolean } & Location
  >({
    auto: false,
    ...props.enterLocation,
  })

  const scrollMemorize = () => {
    if (history.state?.scrollY !== window.scrollY) {
      /**
       * replaceState 가 발생하면 input field 의 자동완성(제안) 팝오버가 꺼지기 때문에
       * 잦은 replaceState 는 유저 경험에 악영향을 줄 수 있다.
       */
      history.replaceState(
        {
          ...history.state,
          // scroll restore 를 위해 스크롤 좌표 저장
          scrollY: window.scrollY,
        },
        ""
      )
    }
  }

  useEffect(() => {
    // if ('scrollRestoration' in history) {
    //   if (history.scrollRestoration !== 'manual') {
    //     history.scrollRestoration = 'manual';
    //   }
    // }

    const onPopState = async (event: PopStateEvent) => {
      setBrowsing(true)
      const locationObj = {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      }
      const pathUrl = location.pathname + location.search

      // 새로고침 이후의 히스토리 백이라서 이전 라우트 정보가 없을 경우엔 라우터 정보를 받아 온다.
      // eslint-disable-next-line no-constant-condition
      if (true /* 임시, 매번 페이지 데이터를 새로 받아 온다 */) {
        const res = await fetch("/_/r" + pathUrl, { method: "POST" })
        const ret: {
          r: UniversalRouteInfoNode[]
          data: {
            [pattern: string]: any
          }
        } = await res.json()

        // 라우트 컴포넌트 미리 로드
        await prepareRouteShards(ret.r.map((routeNode) => routeNode.shardPath))

        const [newRouteTree, changed] = graftRouteNodesToRouteTree(
          ret.r,
          routeTree
        )

        if (changed) {
          setRouteTree(newRouteTree)
        }
        setCurrentRouteDataMap({ ...currentRouteDataMap, ...ret.data })
      }

      setCurrentLocation({ auto: false, ...locationObj })

      setBrowsing(false)

      requestAnimationFrame(() => {
        // debugger;
        if (history.state.scrollY) {
          window.scroll(0, history.state.scrollY)
        }
      })
    }

    addEventListener("popstate", onPopState)
    return () => {
      removeEventListener("popstate", onPopState)
    }
  }, [null])

  useEffect(() => {
    const onScroll = () => {
      // 스크롤이 완료 되면 스크롤 좌표를 기억하기 위해 debounce
      if (scrollMemorizeTimeoutIdRef.current !== null) {
        clearTimeout(scrollMemorizeTimeoutIdRef.current)
      }

      scrollMemorizeTimeoutIdRef.current = setTimeout(() => {
        scrollMemorize()
      }, 100) as unknown as number
    }

    window.addEventListener("scroll", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  })

  const preloadRouteShards = async (href: string) => {
    if (isOutboundHref(href)) {
      return
    }
    const res = await fetch("/_/pl" + href, { method: "POST" })
    if (res.status !== 200) {
      throw new Error(await res.text())
    }

    const ret: {
      r: UniversalRouteInfoNode[]
      a: ShardPath[] // script shard paths
      d: ShardPath[] // style shard paths
    } = await res.json()

    ret.a.forEach((scriptShard) => {
      rootCtx.preloader(scriptShard, "script")
    })

    ret.d.forEach((scriptShard) => {
      rootCtx.preloader(scriptShard, "style")
    })

    if (Array.isArray(ret.r)) {
      ret.r.map((routeInfo) => {
        rootCtx.loader(routeInfo.shardPath).then((module) => {
          rootCtx.registerComponentByShardPath(
            routeInfo.shardPath,
            module.default
          )
        })
      })
    }
  }

  const prepareNavigate: PrepareForNavigate = async (
    href: string,
    navigateFunction: (
      destination: string,
      overrideOptions?: NavigateOptions
    ) => void,
    options?: NavigateOptions
  ) => {
    /**
     * process for registered onBeforeRouting handlers
     */
    const beforeRoutingHandlerIds = Object.keys(beforeRoutingListeners)
    if (beforeRoutingHandlerIds.length > 0) {
      for (const beforeRoutingHandlerId of beforeRoutingHandlerIds) {
        const handler = beforeRoutingListeners[beforeRoutingHandlerId]
        if (handler === null) {
          continue
        }
        /**
         * If returned `false` from handler of handlers even one
         * Will not process navigate to destination
         */
        if (handler() === false) {
          return
        }
      }
    }
    // navigate 하기 전에 현재 페이지에 대한 정보를 history state 에 저장 한다
    scrollMemorize()

    /**
     * preprocessing routing destination
     */
    if (href.startsWith("/")) {
      // nothing to do in here
    } else if (href.startsWith("#")) {
      // will change hash
      location.href = href
      return
    } else if (href.startsWith("?")) {
      // same destination path routing
      href = location.pathname + href
    } else {
      // outgoing routing
      location.href = href
      return
    }

    setBrowsing(true)

    try {
      const res = await fetch("/_/r" + href, { method: "POST" })
      if (res.status !== 200) {
        throw new Error(await res.text())
      }

      const ret: {
        r: UniversalRouteInfoNode[]
        data: {
          [pattern: string]: any
        }
        a: ShardPath[] // script shard paths
        d: ShardPath[] // style shard paths
      } = await res.json()

      ret.a.forEach((scriptShard) => {
        rootCtx.preloader(scriptShard, "script")
      })

      ret.d.forEach((scriptShard) => {
        rootCtx.preloader(scriptShard, "style")
      })

      const loadedRouteDataPaths = Object.keys(ret.data)
      for (const routePath of loadedRouteDataPaths) {
        const routeData = ret.data[routePath]

        /**
         * if Any of routes response redirect instruction
         * will redirect with re call prepareNavigate
         */
        if (routeData && routeData.redirect) {
          prepareNavigate(routeData.redirect, navigateFunction)
          return
        }
      }

      // 라우트 컴포넌트 미리 로드
      !ProductionMode && console.log("prepare route modules")
      try {
        await prepareRouteShards(ret.r.map((routeNode) => routeNode.shardPath))
      } catch (e) {
        console.error("failed to load route", e)
      }
      // 라우트 컴포넌트 미리 로드
      !ProductionMode && console.log("loaded route modules")

      /**
       * 상위 컴포넌트에게 라우팅 정보와 데이터를 전달 한 후 React Router 로 네비게이트 한다.
       * 상태 업데이트가 비동기라도 업데이트 요청에 따라 순차적으로 처리 될것이므로
       * onFetchRoute 에서 상태 업데이트 요청을 시작 한 후에 아래 navigate 를 호출 해도 라우트가 먼저 반영되고 업데이트 된 후에
       * 페이지가 실제로 이동될것이다.
       */

      const [newRouteTree, changed] = graftRouteNodesToRouteTree(
        ret.r,
        routeTree
      )

      if (changed) {
        setRouteTree(newRouteTree)
      }
      setCurrentRouteDataMap({ ...currentRouteDataMap, ...ret.data })

      // 실제 URL 이동
      navigateFunction(href, options)

      // 실제 라우터에 반영할 로케이션
      setCurrentLocation({ auto: false, ...UrlStringToURLComponents(href) })

      /**
       * Scroll reset after done navigating routine if resetScroll option is true
       */
      if (options?.resetScroll ?? false) {
        window.scrollTo(0, 0)
        scrollMemorize()
      }
    } catch (e) {
      console.error("route error :", e)
    }
    setBrowsing(false)
  }
  /**
   * url 새로고침을 하지 않고 현재 페이지의 내용을 새로 로드하여 UI에 반영하는 함수
   * location.reload() 와 비슷 하지만,
   * 현재 페이지 상태를 어느정도 유지 하면서 서버측 데이터를 다시 로딩하는 목적으로 사용 할 수 있다.
   */
  const softReload = async () => {
    const res = await fetch("/_/r" + location.pathname + location.search, {
      method: "POST",
    })
    const ret: {
      r: UniversalRouteInfoNode[]
      data: {
        [pattern: string]: any
      }
    } = await res.json()

    setCurrentRouteDataMap({ ...currentRouteDataMap, ...ret.data })
  }

  return (
    <AppRoutingContext.Provider
      value={{
        prepareNavigate: prepareNavigate,
        preloadRouteShards: preloadRouteShards,
        browsing: browsing,
        routeTree: routeTree,
        routeDataMap: currentRouteDataMap,
        currentLocation: currentLocation,
        softReload: softReload,
        setRouteTree: setRouteTree,
        setCurrentLocation: setCurrentLocation,
        offBeforeRouting: (id, handler) => {
          setBeforeRoutingListeners((state) => ({ ...state, [id]: null }))
        },
        onBeforeRouting: (id, handler) => {
          setBeforeRoutingListeners((state) => ({ ...state, [id]: handler }))
        },
      }}
    >
      {props.children}
    </AppRoutingContext.Provider>
  )
}
