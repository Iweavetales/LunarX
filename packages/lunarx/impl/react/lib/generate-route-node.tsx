import { RouteTreeNode, ShardLoader } from "../router"
import { RouteServerFetchDataMap } from "~/core/document-types"
import { Route, RouteObject } from "react-router"
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

export const RouteElement = (props: {
  routeNode: RouteTreeNode
  loader?: ShardLoader
  routeDataMap: RouteServerFetchDataMap
}) => {
  return (
    <ErrorBoundary
      fallback={<Error matchPattern={props.routeNode.matchPattern} />}
    >
      <Suspense fallback={<Loading />}>
        <ServerFetchesProvider dataKey={props.routeNode.matchPattern}>
          <ComponentShardWrapper
            key={props.routeNode.shardPath}
            shardPath={props.routeNode.shardPath}
          />
        </ServerFetchesProvider>
      </Suspense>
    </ErrorBoundary>
  )
}

export const GenerateRouteNodeTree = (options: {
  routeNode: RouteTreeNode
  loader?: ShardLoader
  routeDataMap: RouteServerFetchDataMap
}): RouteObject => {
  return {
    path: options.routeNode.matchPattern,
    element: (
      <RouteElement
        routeNode={options.routeNode}
        loader={options.loader}
        routeDataMap={options.routeDataMap}
      />
    ),
    // loader: rootLoader,
    children: options.routeNode.children.map((routeNode) =>
      GenerateRouteNodeTree({
        routeNode: routeNode,
        loader: options.loader,
        routeDataMap: options.routeDataMap,
      })
    ),
  }
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
        <RouteElement
          routeNode={options.routeNode}
          routeDataMap={options.routeDataMap}
          loader={options.loader}
        />
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
