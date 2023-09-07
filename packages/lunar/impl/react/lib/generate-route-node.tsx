import { RouteTreeNode, ShardLoader } from "../router"
import { RouteServerFetchDataMap } from "~/core/document-types"
import { Route } from "react-router"
import React, { Suspense } from "react"
import { ComponentShardWrapper } from "./component-shard-wrapper"
import { ServerFetchesProvider } from "./server-fetches-provider"

const Loading = () => {
  return <span>Loading...</span>
}

const Error = () => {
  return <span>Something went wrong</span>
}

type ErrorBoundaryProps = {
  fallback: React.ReactNode
  children: React.ReactNode
}
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch(error: any, info: any) {
    // Example "componentStack":
    //   in ComponentThatThrows (created by App)
    //   in ErrorBoundary (created by App)
    //   in div (created by App)
    //   in App
    // logErrorToMyService(error, info.componentStack);
    console.error(error)
    console.log(info)
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback
    }

    return this.props.children
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
        <ErrorBoundary fallback={<Error />}>
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
