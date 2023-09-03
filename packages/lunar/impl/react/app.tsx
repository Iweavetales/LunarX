import React, { useContext } from "react"
import { RootAppContext } from "./lib/root-app-context"
import { EmptyRoute } from "./router"
import { Route, Routes } from "react-router"
import { GenerateSwiftRouteNode } from "./lib/root-app-container"
import { AppRouterContext } from "./lib/router-context"

/**
 * props 는 받지 않고 컨텍스트로 SwiftApp 으로 부터 데이터를 전달 받아 라우트 맵을 구성하고 랜더링 한다.
 * 유저가 직접 이(SwiftRenderer) 컴포넌트를 붙일 수 있다.
 * @constructor
 */
export const SwiftRenderer = () => {
  const pipeCtx = useContext(RootAppContext)
  const routeCtx = useContext(AppRouterContext)

  let loc = null
  if (!routeCtx.currentLocation.auto) {
    /**
     * 💡 swift/Router 에 의해 컨트롤 되는 값 💡
     * 이 값이 변경 되면 화면이 해당 라우트 계층으로 랜더링 된다
     */
    loc = routeCtx.currentLocation
  }

  return (
    <>
      <Routes location={loc ?? undefined}>
        {routeCtx.routeTree.map((node) => {
          // return (
          //   <RouteWrapper
          //     key={node.matchPattern}
          //     loader={pipeCtx.loader}
          //     pattern={node.matchPattern}
          //     routeNode={node}
          //   ></RouteWrapper>
          // );

          const routeNode = GenerateSwiftRouteNode({
            routeNode: node,
            loader: pipeCtx.loader,
            routeDataMap: routeCtx.routeDataMap,
          })

          return routeNode
        })}
        <Route path="*" element={<EmptyRoute />} />
      </Routes>

      {routeCtx.browsing && (
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
