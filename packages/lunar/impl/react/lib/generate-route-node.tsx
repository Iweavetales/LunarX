import { RouteTreeNode, ShardLoader } from "../router"
import { RouteServerFetchDataMap } from "~/core/document-types"
import { Route } from "react-router"
import React from "react"
import { ComponentShardWrapper } from "./component-shard-wrapper"
import { ServerFetchesProvider } from "./server-fetches-provider"

export const GenerateRouteNode = (options: {
  routeNode: RouteTreeNode
  loader?: ShardLoader
  routeDataMap: RouteServerFetchDataMap
}) => {
  // 이 함수(GenerateSwiftRouteNode) 자체는 React 컴포넌트가 아니고 React Component 를 생성하는 함수이다
  // const component = options.loader!(options.routeNode.shardPath)
  // const serverFetchesResult = options.routeDataMap[options.routeNode.matchPattern];
  // const serverFetchError = serverFetchesResult?.error;

  return (
    <Route
      key={options.routeNode.matchPattern}
      element={
        <ServerFetchesProvider dataKey={options.routeNode.matchPattern}>
          <ComponentShardWrapper
            key={options.routeNode.shardPath}
            shardPath={options.routeNode.shardPath}
          />

          {/*<ShardComponent shardPath={props.routeNode.shardPath} />*/}
        </ServerFetchesProvider>
      }
      path={options.routeNode.matchPattern}
      // path={props.routeNode.matchPattern.replace(props.routeNode.upperRouteMatchPattern, '').replace(/^\/?/, '/')}
    >
      {options.routeNode.children.map((routeNode) =>
        GenerateRouteNode({
          routeNode: routeNode,
          loader: options.loader,
          routeDataMap: options.routeDataMap,
        })
      )}
    </Route>
  )
}
