import { RouteNode, RouteNodeMap } from "../lib/Manifest"
import React from "react"
import { Routes, Route } from "react-router"
import { ServerFetchesProvider } from "../src/serverFetches"
import { LunarContext } from "../src/lunarContext"
import { GetRouterModule } from "./types"

export default function ServerBuildRouter(
  context: LunarContext,
  routeNodes: RouteNodeMap,
  getRouterModule: GetRouterModule
) {
  return (props: { routeFetchesResults: { [routePattern: string]: any } }) => {
    const routePatterns = Object.keys(routeNodes)

    /**
     * 상위라우터가 없는 최상위 라우터들만 추출
     */
    const topLevelRoutes = routePatterns.filter((pattern) => {
      const routeNode = routeNodes[pattern]
      if (routeNode.upperRoutePattern) {
        return false
      }
      return true
    })

    function RenderRouteNode(routeNode: RouteNode, upperRoutePattern: string) {
      const pattern = routeNode.routePattern

      let Component = getRouterModule(pattern)
      if (Component === undefined) {
        Component = () => <div>Not found Page</div>
      }
      return (
        <Route
          path={pattern}
          element={
            /**
             * routeFetchesResults 에 이 라우트 패턴에 해당 하는 fetch 내역을 ServerFetchesProvider 로 result 로 전달 하여
             * 라우트 컴포넌트 랜더링 시에 useServerFetches 를 통해 사용될 수 있도록 한다
             */
            <ServerFetchesProvider dataKey={pattern}>
              <Component />
            </ServerFetchesProvider>
          }
          key={pattern}
        >
          {routeNode.childrenRoutePatterns &&
            routeNode.childrenRoutePatterns
              /**
               * 현재 라우트노드가 보유중인 하위 라우터중 현재 입력된(routeNodes) 노드 목록에 존재 하는 라우터만 포함시킨다
               */
              .filter((childPattern) => routeNodes[childPattern])
              .map((childPattern) => {
                const childRouteNode = routeNodes[childPattern]

                if (childRouteNode) {
                  return RenderRouteNode(childRouteNode, pattern)
                } else {
                  console.error(`Called unlisted route[${childPattern}]`)
                  return null
                }
              })}
        </Route>
      )
    }

    return (
      <Routes>
        {topLevelRoutes.map((pattern) => {
          return RenderRouteNode(routeNodes[pattern], "")
        })}
      </Routes>
    )
  }
}
