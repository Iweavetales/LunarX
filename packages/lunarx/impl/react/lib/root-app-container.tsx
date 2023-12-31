import React, { useState } from "react"
import {
  RouteServerFetchDataMap,
  UniversalRouteInfoNode,
} from "~/core/document-types"
import {
  PreloadResource,
  RootAppContext,
  RootAppContextValue,
  ShardLoader,
} from "./root-app-context"
import { PublicErrorInfo } from "~/core/context"

export default function LunarAppContainer(props: {
  initError?: PublicErrorInfo | null
  ascendRouteNodeList: UniversalRouteInfoNode[]
  loader: ShardLoader
  preload: PreloadResource
  preloadedComponents: { [shardPath: string]: React.FunctionComponent }
  routeShardPrepareTrigger: (shardPaths: string[]) => Promise<void>
  dataMatchMap: RouteServerFetchDataMap
  children?: React.ReactNode
  errorComponent: React.FunctionComponent
  notFoundComponent: React.FunctionComponent
  enterLocation: {
    pathname: string
    search: string
    hash: string
  }
  staticHandler?: RootAppContextValue["staticHandler"]
  initScriptShardPathDependencies: string[]
  initStyleShardPathDependencies: string[]
}) {
  const [loadedComponents, setLoadedComponents] = useState({
    ...props.preloadedComponents,
  })

  return (
    <RootAppContext.Provider
      value={{
        initError: props.initError,
        loader: props.loader,
        preloader: props.preload,
        routeShardPrepareTrigger: props.routeShardPrepareTrigger,
        components: loadedComponents,
        errorComponent: props.errorComponent,
        notFoundComponent: props.notFoundComponent,
        ascendRouteNodeList: props.ascendRouteNodeList,
        dataMatchMap: props.dataMatchMap,
        enterLocation: props.enterLocation,
        initScriptShardPathDependencies: props.initScriptShardPathDependencies,
        initStyleShardPathDependencies: props.initStyleShardPathDependencies,
        registerComponentByShardPath: (shardPath, shard) => {
          setLoadedComponents((state) => {
            return {
              ...state,
              [shardPath]: shard,
            }
          })
        },
        staticHandler: props.staticHandler,
      }}
    >
      {props.children}
    </RootAppContext.Provider>
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
