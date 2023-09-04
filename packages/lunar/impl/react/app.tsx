import React, { useContext } from "react"
import { RootAppContext } from "./lib/root-app-context"
import { Route404 } from "./router"
import { Route, Routes } from "react-router"
import { AppRouterContext } from "./lib/router-context"
import { GenerateRouteNode } from "./lib/generate-route-node"

/**
 * props 는 받지 않고 컨텍스트로 SwiftApp 으로 부터 데이터를 전달 받아 라우트 맵을 구성하고 랜더링 한다.
 * 유저가 직접 이(SwiftRenderer) 컴포넌트를 붙일 수 있다.
 * @constructor
 */
export const SwiftRenderer = () => {
  const rootAppContext = useContext(RootAppContext)
  const appRouterContext = useContext(AppRouterContext)

  let loc = null
  if (!appRouterContext.currentLocation.auto) {
    /**
     * 💡 swift/Router 에 의해 컨트롤 되는 값 💡
     * 이 값이 변경 되면 화면이 해당 라우트 계층으로 랜더링 된다
     */
    loc = appRouterContext.currentLocation
  }

  return (
    <>
      <Routes location={loc ?? undefined}>
        {appRouterContext.routeTree.map((node) => {
          const routeNode = GenerateRouteNode({
            routeNode: node,
            loader: rootAppContext.loader,
            routeDataMap: appRouterContext.routeDataMap,
          })

          return routeNode
        })}
        <Route path="*" element={<Route404 />} />
      </Routes>

      {appRouterContext.browsing && (
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
      )}
    </>
  )
}
