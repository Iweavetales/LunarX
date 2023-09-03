import React, { useContext, useState } from "react"
import { Route, Routes } from "react-router"
import {
  RouteServerFetchDataMap,
  UniversalRouteInfoNode,
} from "../../../lib/document-types"
import { ServerFetchesProvider } from "../ssfetch"
import { RouteTreeNode, ShardLoader } from "../router"
import { RootAppContext } from "./root-app-context"
import { AppRouterProvider } from "./router"

export default function LunarAppContainer(props: {
  ascendRouteNodeList: UniversalRouteInfoNode[]
  loader: ShardLoader
  preloadedComponents: { [shardPath: string]: React.FunctionComponent }
  routeShardPrepareTrigger?: (shardPaths: string[]) => Promise<void>
  dataMatchMap: RouteServerFetchDataMap
  children?: React.ReactNode
  enterLocation: {
    pathname: string
    search: string
    hash: string
  }
}) {
  const [loadedComponents, setLoadedComponents] = useState({
    ...props.preloadedComponents,
  })

  return (
    <RootAppContext.Provider
      value={{
        loader: props.loader,
        routeShardPrepareTrigger: props.routeShardPrepareTrigger,
        components: loadedComponents,
      }}
    >
      <AppRouterProvider
        enterLocation={props.enterLocation}
        enterRouteNodeList={props.ascendRouteNodeList}
        enterRouteData={props.dataMatchMap}
      >
        {props.children}
      </AppRouterProvider>
    </RootAppContext.Provider>
  )
}

const ComponentShardWrapper = (props: { shardPath: string }) => {
  const appRouteContext = useContext(RootAppContext)

  const Component: React.FunctionComponent =
    appRouteContext.components?.[props.shardPath] ||
    (() => <div> Not loaded yet </div>)

  return <Component />
}

export const GenerateSwiftRouteNode = (options: {
  routeNode: RouteTreeNode
  loader?: ShardLoader
  routeDataMap: RouteServerFetchDataMap
}) => {
  // 이 함수(GenerateSwiftRouteNode) 자체는 React 컴포넌트가 아니고 React Component 를 생성하는 함수이다
  // const component = options.loader!(options.routeNode.shardPath)
  // const serverFetchesResult = options.routeDataMap[options.routeNode.matchPattern];
  // const serverFetchError = serverFetchesResult?.error;

  console.log(
    "options.routeNode.matchPattern",
    options.routeNode.matchPattern,
    options.routeNode
    // component
  )
  return (
    <Route
      key={options.routeNode.matchPattern}
      element={
        <ServerFetchesProvider dataKey={options.routeNode.matchPattern}>
          <ComponentShardWrapper shardPath={options.routeNode.shardPath} />

          {/*<ShardComponent shardPath={props.routeNode.shardPath} />*/}
        </ServerFetchesProvider>
      }
      path={options.routeNode.matchPattern}
      // path={props.routeNode.matchPattern.replace(props.routeNode.upperRouteMatchPattern, '').replace(/^\/?/, '/')}
    >
      {options.routeNode.children.map((routeNode) =>
        GenerateSwiftRouteNode({
          routeNode: routeNode,
          loader: options.loader,
          routeDataMap: options.routeDataMap,
        })
      )}
    </Route>
  )
}
//
// const RouteWrapper = (props: { routeNode: RouteTreeNode; pattern: string; loader: ShardLoader }) => {
//   const routeCtx = useContext(SwiftRouterContext);
//   return (
//     <Route
//       key={props.pattern}
//       element={
//         <ServerFetchesProvider result={routeCtx.routeDataMap[props.pattern] || null}>
//           <ComponentShardWrapper component={props.loader(props.routeNode.shardPath)} />
//
//           {/*<ShardComponent shardPath={props.routeNode.shardPath} />*/}
//         </ServerFetchesProvider>
//       }
//       path={props.pattern}
//       // path={props.routeNode.matchPattern.replace(props.routeNode.upperRouteMatchPattern, '').replace(/^\/?/, '/')}
//     >
//       {props.routeNode.children.map(routeNode => (
//         <RouteWrapper
//           key={routeNode.matchPattern}
//           routeNode={routeNode}
//           pattern={routeNode.matchPattern}
//           loader={props.loader}
//         />
//       ))}
//     </Route>
//   );
// };
