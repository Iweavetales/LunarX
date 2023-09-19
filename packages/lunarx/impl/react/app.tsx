import React, { useContext, useMemo } from "react"
import { RootAppContext } from "./lib/root-app-context"
import { Route, RouterProvider, Routes } from "react-router"
import { AppRoutingContext } from "./lib/router-context"
import {
  GenerateRouteNode,
  GenerateRouteNodeTree,
} from "./lib/generate-route-node"
import { createBrowserRouter } from "react-router-dom"
import { AppRoutingProvider } from "./lib/app-routing-provider"
import { createStaticRouter } from "react-router-dom/server"
// import type { StaticHandlerContext } from "react-router"

/**
 * props 는 받지 않고 컨텍스트로 SwiftApp 으로 부터 데이터를 전달 받아 라우트 맵을 구성하고 랜더링 한다.
 * 유저가 직접 이(SwiftRenderer) 컴포넌트를 붙일 수 있다.
 * @constructor
 */
export const SwiftRenderer = () => {
  const rootAppContext = useContext(RootAppContext)

  return (
    <AppRoutingProvider
      enterLocation={rootAppContext.enterLocation}
      enterRouteNodeList={rootAppContext.ascendRouteNodeList}
      enterRouteData={rootAppContext.dataMatchMap}
    >
      <AppRouter />
      <RoutingIndicator />
    </AppRoutingProvider>
  )
}

const RoutingIndicator = () => {
  const appRoutingContext = useContext(AppRoutingContext)

  if (appRoutingContext.browsing) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          boxShadow: "0 0 10px 0 rgba(0,0,0,.3)",
          padding: 10,
          position: "fixed",
          bottom: 10,
          right: 10,
          borderRadius: 10,
          pointerEvents: "none",
        }}
      >
        loading
      </div>
    )
  }
  return null
}

const AppRouter = () => {
  const rootAppContext = useContext(RootAppContext)
  const appRoutingContext = useContext(AppRoutingContext)
  const NotFoundComponent = rootAppContext.notFoundComponent

  let loc = null
  if (!appRoutingContext.currentLocation.auto) {
    /**
     * 💡 swift/Router 에 의해 컨트롤 되는 값 💡
     * 이 값이 변경 되면 화면이 해당 라우트 계층으로 랜더링 된다
     */
    loc = appRoutingContext.currentLocation
  }

  // Defer implement data router
  // const routes = useMemo(
  //   () =>
  //     appRoutingContext.routeTree.map((node) => {
  //       const routeNode = GenerateRouteNodeTree({
  //         routeNode: node,
  //         loader: rootAppContext.loader,
  //         routeDataMap: appRoutingContext.routeDataMap,
  //       })
  //
  //       return routeNode
  //     }),
  //   [appRoutingContext.routeTree]
  // )

  const routeElementList = useMemo(
    () =>
      appRoutingContext.routeTree.map((node) => {
        const routeNode = GenerateRouteNode({
          routeNode: node,
          loader: rootAppContext.loader,
          routeDataMap: appRoutingContext.routeDataMap,
        })

        return routeNode
      }),
    [appRoutingContext.routeTree]
  )

  // Defer implement data router
  const dataRouter = null
  // const dataRouter = useMemo(() => {
  //   return null
  //   if (typeof document !== "undefined") {
  //     return createBrowserRouter(
  //       [
  //         ...routes,
  //
  //         {
  //           path: "*",
  //           element: <NotFoundComponent />,
  //         },
  //       ],
  //       {}
  //     )
  //   } else {
  //     if (rootAppContext.staticHandler) {
  //       return createStaticRouter(
  //         rootAppContext.staticHandler.dataRoutes,
  //         rootAppContext.staticHandler.context
  //       )
  //     }
  //     return null
  //   }
  // }, [routes])

  if (dataRouter !== null) {
    /**
     * Defer implement data router
     */
    return <RouterProvider router={dataRouter} />
  } else {
    return (
      <Routes location={loc ?? undefined}>
        {routeElementList}
        <Route path="*" element={<NotFoundComponent />} />
      </Routes>
    )
  }
}
