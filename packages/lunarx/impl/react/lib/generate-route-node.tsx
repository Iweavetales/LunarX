import { RouteTreeNode, ShardLoader } from "../router"
import { RouteServerFetchDataMap } from "~/core/document-types"
import { Route } from "react-router"
import React, { Suspense, useContext } from "react"
import { ComponentShardWrapper } from "./component-shard-wrapper"
import { ServerFetchesProvider } from "./server-fetches-provider"
import { ErrorBoundary } from "./error-boundary"
import { RootAppContext } from "./root-app-context"

const Loading = () => {
  return <span>Loading...</span>
}

const Error = (props: { matchPattern: string }) => {
  const rootAppContext = useContext(RootAppContext)
  const RootErrorComponent = rootAppContext.errorComponent
  return <RootErrorComponent />
}

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
        <ErrorBoundary
          fallback={<Error matchPattern={options.routeNode.matchPattern} />}
        >
          <Suspense fallback={<Loading />}>
            <ServerFetchesProvider dataKey={options.routeNode.matchPattern}>
              <ComponentShardWrapper
                key={options.routeNode.shardPath}
                shardPath={options.routeNode.shardPath}
              />
            </ServerFetchesProvider>
          </Suspense>
        </ErrorBoundary>
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
