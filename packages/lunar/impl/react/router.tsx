import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useNavigate } from "react-router"
import { UniversalRouteNode } from "../../lib/document-types"
import { Location, UrlToLocation } from "../../lib/location"
import { useRouteShardPreparing } from "./app-root-pipe-context"

export type ComponentModule = any
/**
 * shard 로더
 * 실제 함수 형식의 컴포넌트를 반환 해야 한다
 */

export type ShardLoader = (shardPath: string) => ComponentModule
export type RouteTreeNode = UniversalRouteNode & {
  children: RouteTreeNode[]
}

type SwiftRouterProvides = {
  push: (href: string, options?: { query?: { [name: string]: any } }) => void
  browsing: boolean
  currentLocation: {
    auto: boolean
  } & Location
  routeTree: RouteTreeNode[]
  routeDataMap: { [pattern: string]: any }
  softReload: () => Promise<void>
}
export const SwiftRouterContext = createContext<SwiftRouterProvides>({
  push: () => {
    /**/
  },
  currentLocation: { auto: false, hash: "", pathname: "", search: "" },
  browsing: false,
  routeTree: [],
  routeDataMap: {},
  softReload: async () => {
    /**/
  },
})

export function SwiftRouterProvider(props: {
  children: React.ReactNode
  // onFetchedRoute: (newRoutes: UniversalRouteNode[], dataMap: { [pattern: string]: any }) => void;
  enterRouteNodeList: UniversalRouteNode[]
  enterLocation: Location
  enterRouteData: { [pattern: string]: any }
}) {
  const navigate = useNavigate()
  const prepareRouteShards = useRouteShardPreparing()
  const [browsing, setBrowsing] = useState(false)
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
      console.log("## memorize scroll", window.scrollY)
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
      console.log("pop state", event)
      const locationObj = {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      }
      const pathUrl = location.pathname + location.search

      // 새로고침 이후의 히스토리 백이라서 이전 라우트 정보가 없을 경우엔 라우터 정보를 받아 온다.
      // eslint-disable-next-line no-constant-condition
      if (true /* 임시, 매번 페이지 데이터를 새로 받아 온다 */) {
        const res = await fetch("/_/r" + pathUrl)
        const ret: {
          r: UniversalRouteNode[]
          data: {
            [pattern: string]: any
          }
        } = await res.json()

        console.log("back ", ret)
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
        console.log("requestAnimationFrame")
        // debugger;
        if (history.state.scrollY) {
          console.log("## scroll restore", history.state.scrollY, window.scroll)
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

  const push = async (href: string, options?: {}) => {
    // navigate 하기 전에 현재 페이지에 대한 정보를 history state 에 저장 한다
    scrollMemorize()

    /**
     * '/' 로 시작하는 내부 경로가 아니면 location.href 로 외부 링크로 이동시킨다
     */
    if (!/^\//.test(href)) {
      location.href = href
      return
    }

    setBrowsing(true)
    //

    try {
      const res = await fetch("/_/r" + href)
      if (res.status !== 200) {
        throw new Error(await res.text())
      }

      const ret: {
        r: UniversalRouteNode[]
        data: {
          [pattern: string]: any
        }
      } = await res.json()

      // 라우트 컴포넌트 미리 로드
      try {
        await prepareRouteShards(ret.r.map((routeNode) => routeNode.shardPath))
      } catch (e) {
        console.error("failed to load route", e)
      }

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
      navigate(href, {
        state: {
          id: `${Date.now()}-${Math.random() * 1000}`,
        },
        preventScrollReset: true,
      })

      // 실제 라우터에 반영할 로케이션
      setCurrentLocation({ auto: false, ...UrlToLocation(href) })
      window.scrollTo(0, 0)
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
    const res = await fetch("/_/r" + location.pathname + location.search)
    const ret: {
      r: UniversalRouteNode[]
      data: {
        [pattern: string]: any
      }
    } = await res.json()

    setCurrentRouteDataMap({ ...currentRouteDataMap, ...ret.data })
  }

  return (
    <SwiftRouterContext.Provider
      value={{
        push: push,
        browsing: browsing,
        routeTree: routeTree,
        routeDataMap: currentRouteDataMap,
        currentLocation: currentLocation,
        softReload: softReload,
      }}
    >
      {props.children}
    </SwiftRouterContext.Provider>
  )
}

export const EmptyRoute = (props: {}) => {
  const routeCtx = useContext(SwiftRouterContext)

  useEffect(() => {
    console.log("empty route")
  })
  return <div>404 Not found</div>
}

export function Link(props: {
  href: string
  children?: React.ReactNode
  className?: string
}) {
  const ctx = useContext(SwiftRouterContext)

  return (
    <a
      onClick={(e) => {
        // route 체크 후 라우터 반영

        // location.href = props.href;
        ctx.push(props.href, {})

        e.preventDefault()
      }}
      href={props.href}
      className={props.className}
    >
      {props.children}
    </a>
  )
}

/**
 * url 새로고침을 하지 않고 현재 페이지의 내용을 새로 로드하여 UI에 반영하는 함수
 * location.reload() 와 비슷 하지만,
 * 현재 페이지 상태를 어느정도 유지 하면서 서버측 데이터를 다시 로딩하는 목적으로 사용 할 수 있다.
 */
export const useSoftReload = () => {
  return useContext(SwiftRouterContext).softReload
}

export const useSwiftRouter = () => {
  return useContext(SwiftRouterContext)
}

/**
 * graftRouteNodesToRouteTree
 * 라우트 tree 에 정해진 [터미널 라우트 노드] 까지의 라우트 노드 줄기를 한 줄기씩 붙이는 함수
 * 어차피 한번에 여러개의 터미널 라우트에 접근하지 않고 페이지를 이동 할 때도 하나의 터미널로만 이동 하기 때문에 한 줄기씩 붙여도 문제가 없다.
 *
 * route tree 에 가지를 접붙힌다
 * @param ascendRouteNodeList
 *  상위 노드(ex, "/blog")부터 지정된 하위 노드(ex, "/blog/post/id")까지 이어진 하나의 줄기에 해당하는 노드 목록(ex, "/blog", "/blog/post", "/blog/post/id")
 *  이 줄기외에 다른 줄기로 이어지는 노드는 입력하면 안된다 (ex, "/blog/edit")
 *  만약 다른 줄기로 이어지는 노드를 새로 접붙이려면 해당 노드까지 이어지는 리스트를 가지고 다시 graftRouteNodesToRouteTree() 를 호출 해야 한다
 * @param tree
 *
 * @return [newTree:RouteTreeNode[], changed:boolean]
 */
function graftRouteNodesToRouteTree(
  ascendRouteNodeList: UniversalRouteNode[],
  trees: RouteTreeNode[]
): [RouteTreeNode[], boolean] {
  //
  const clonedTrees: RouteTreeNode[] = JSON.parse(JSON.stringify(trees))
  let changed = false
  const ascendNodeCount = ascendRouteNodeList.length

  /**
   * 입력된 ascendRouteNodeList 의 라우트 노드를 차례대로 돌아가며 tree 에 존재하는 동일한 라우트 노드외에 tree 에 존재하지 않는 라우트 노드를 tree 에 추가 한다.
   */
  for (let i = 0; i < ascendNodeCount; i++) {
    const currentNode = ascendRouteNodeList[i]

    const upperRouteNodePattern = currentNode.upperRouteMatchPattern
    if (upperRouteNodePattern) {
      const foundUpperNode = findRefTreeRouteNode(
        clonedTrees,
        upperRouteNodePattern
      )
      if (foundUpperNode) {
        if (
          foundUpperNode.children.findIndex(
            (node) => node.matchPattern === currentNode.matchPattern
          ) === -1
        ) {
          foundUpperNode.children.push({ ...currentNode, children: [] })
          changed = true
        }
      } else {
        throw new Error(`Not found upper node[${upperRouteNodePattern}]`)
      }
    } else {
      // 현재 노드의 상위 노드가 지정되어 있지 않고 최상위 노드중 현재 노드가 없으면 현재 노드를 최상위 노드로 편입 시킨다
      if (
        clonedTrees.findIndex(
          (node) => node.matchPattern === currentNode.matchPattern
        ) === -1
      ) {
        clonedTrees.push({ ...currentNode, children: [] })
        changed = true
      }
    }
  }

  return [clonedTrees, changed]
}

function findRefTreeRouteNode(
  tree: RouteTreeNode[],
  findTargetPattern: string
): RouteTreeNode | null {
  //

  const stack = [...tree]
  const depth = 0

  // tree 순회로 대상을 찾는다
  for (let node = stack.pop(); node; node = stack.pop()) {
    if (node.matchPattern === findTargetPattern) {
      return node
    }

    if (node.children.length > 0) {
      stack.push(...node.children)
    }
  }

  return null
}

// function graftRouteNodesToRouteTree(
//   ascendRouteNodeList: UniversalRouteNode[],
//   tree: RouteTreeNode[],
// ): [RouteTreeNode[], boolean] {
//   //
//   let clonedTree: RouteTreeNode[] = JSON.parse(JSON.stringify(tree));
//   let changed = false;
//   let ascendNodeCount = ascendRouteNodeList.length;
//
//   let upperChildrenListRef: RouteTreeNode[] = clonedTree;
//   let upperNode: RouteTreeNode | null = null;
//
//   /**
//    * 입력된 ascendRouteNodeList 의 라우트 노드를 차례대로 돌아가며 tree 에 존재하는 동일한 라우트 노드외에 tree 에 존재하지 않는 라우트 노드를 tree 에 추가 한다.
//    */
//   for (let i = 0; i < ascendNodeCount; i++) {
//     let currentNode = ascendRouteNodeList[i];
//
//     /**
//      * 이전 루프에 선택된 상위 노드의 자식 또는 tree 의 최상위 노드 중에서 현재 노드와 같은 노드를 찾는다.
//      */
//     let foundNode: RouteTreeNode | undefined = undefined;
//     if (upperNode !== null) {
//       // 이전 루프에 선택된 상위 노드의 자식중 현재 노드와 같은 노드가 있는지 찾는다.
//       // 단, 이전 루프에서 선택된 상위 노드와 현재 노드의 상위노드가 같아야 한다.
//       // 현재 노드의 상위 노드와 루프에서 선택된 상위노드가 다른 노드라면 에러를 발생 한다.
//       if (upperNode.matchPattern === currentNode.upperRouteMatchPattern) {
//         foundNode = upperNode.children.find(node => node.matchPattern === currentNode.matchPattern);
//
//         console.log('found same node', upperNode, foundNode);
//       } else {
//         throw new Error(
//           `not matched[${currentNode.upperRouteMatchPattern}] to upper route node[${upperNode.matchPattern}]`,
//         );
//       }
//     } else {
//       foundNode = clonedTree.find(node => node.matchPattern === currentNode.matchPattern);
//     }
//
//     if (foundNode) {
//       // 상위 노드를 찾았다면
//       upperNode = foundNode;
//       upperChildrenListRef = foundNode.children;
//     } else {
//       // 노드의 가지를 추가할 상위 노드를 찾지 못하면 남은 노드들의 트리를 만들어 지금까지 찾은 tree 에 추가 한다.
//       let newTreeBranchNode = { ...currentNode, children: [] };
//       upperChildrenListRef.push(newTreeBranchNode);
//       upperChildrenListRef = newTreeBranchNode.children;
//
//       changed = true;
//     }
//   }
//
//   return [clonedTree, changed];
// }
