import React, { useContext, useState } from 'react';
import { Route, Routes } from 'react-router';
import { RouteServerFetchDataMap, UniversalRouteNode } from './DocumentTypes';
import { ServerFetchesProvider } from './serverFetches';
import {EmptyRoute, RouteTreeNode, ShardLoader, SwiftRouterContext, SwiftRouterProvider} from './Router';
import {   SwiftAppRootPipeContext } from './lib/SwiftAppRootPipeContext';

/**
 * @Deprecated ModuleContext
 */
// type ModuleContextValue = {
//   loadedModules: { [shardPath: string]: any };
// };
// const ModuleContext = createContext<ModuleContextValue | null>(null);
// const ModuleContextProvider = (props: {
//   children: React.ReactNode;
//   loader: ShardLoader;
//   preloadTargetModules: string[]; // shardPath list
// }) => {
//   let [loadedModules, setLoadedModules] = useState({});
//   if (props.preloadTargetModules.length > 0) {
//     //
//     // Promise.all(())
//   }
//   return <ModuleContext.Provider value={{ loadedModules: loadedModules }}>{props.children}</ModuleContext.Provider>;
// };
// const ShardComponent = (props: { shardPath: string }) => {
//   const moduleCtx = useContext(ModuleContext);
//   const LoadedModuleComponent = moduleCtx.loadedModules[props.shardPath];
//
//   if (LoadedModuleComponent) {
//     return <LoadedModuleComponent />;
//   }
//
//   return <div>Not loaded yet</div>;
// };

/**
 * SwiftAppContainer
 * @param props
 */
export default function SwiftAppContainer(props: {
  ascendRouteNodeList: UniversalRouteNode[];
  loader: ShardLoader;
  routeShardPrepareTrigger?: (shardPaths: string[]) => Promise<void>;
  dataMatchMap: RouteServerFetchDataMap;
  children?: React.ReactNode;
  enterLocation: {
    pathname: string;
    search: string;
    hash: string;
  };
  // store: any;
}) {
  return (
    <SwiftAppRootPipeContext.Provider
      value={{
        loader: props.loader,
        routeShardPrepareTrigger: props.routeShardPrepareTrigger,
      }}
    >
      <SwiftRouterProvider
        enterLocation={props.enterLocation}
        enterRouteNodeList={props.ascendRouteNodeList}
        enterRouteData={props.dataMatchMap}
      >
        {/*추후 이 부분은 SwiftPlatform 유저가 직접 SwiftApp 의 Children 으로 넣어 줄 수 있도록 변경*/}
        {/*<SwiftRenderer />*/}
        {props.children}
      </SwiftRouterProvider>
    </SwiftAppRootPipeContext.Provider>
  );
}

/**
 * props 는 받지 않고 컨텍스트로 SwiftApp 으로 부터 데이터를 전달 받아 라우트 맵을 구성하고 랜더링 한다.
 * 유저가 직접 이(SwiftRenderer) 컴포넌트를 붙일 수 있다.
 * @constructor
 */
export const SwiftRenderer = () => {
  const pipeCtx = useContext(SwiftAppRootPipeContext);
  const routeCtx = useContext(SwiftRouterContext);

  let loc = null;
  if (!routeCtx.currentLocation.auto) {
    /**
     * 💡 swift/Router 에 의해 컨트롤 되는 값 💡
     * 이 값이 변경 되면 화면이 해당 라우트 계층으로 랜더링 된다
     */
    loc = routeCtx.currentLocation;
  }

  return (
    <div>
      <Routes location={loc ?? undefined}>
        {routeCtx.routeTree.map(node => {
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
          });

          return routeNode;
        })}
        <Route path="*" element={<EmptyRoute />} />
      </Routes>

      {routeCtx.browsing && (
        <div
          style={{
            backgroundColor: '#fff',
            boxShadow: '0 0 10px 0 rgba(0,0,0,.3)',
            padding: 10,
            position: 'fixed',
            bottom: 10,
            right: 10,
            borderRadius: 10,
            pointerEvents: 'none',
          }}
        >
          loading
        </div>
      )}
    </div>
  );
};

const ComponentShardWrapper = (props: { component: any | Promise<any> }) => {
  const Component = props.component;
  const [AsyncComponent, setAsyncComponent] = useState(null);
  /**
   * Promise 여부 분기
   */

  if (Component) {
    return <Component />;
  }

  return <div>Not loaded yet</div>;
};

const GenerateSwiftRouteNode = (options: {
  routeNode: RouteTreeNode;
  loader?: ShardLoader;
  routeDataMap: RouteServerFetchDataMap;
}) => {
  // 이 함수(GenerateSwiftRouteNode) 자체는 React 컴포넌트가 아니고 React Component 를 생성하는 함수이다
  const component = options.loader!(options.routeNode.shardPath);
  // const serverFetchesResult = options.routeDataMap[options.routeNode.matchPattern];
  // const serverFetchError = serverFetchesResult?.error;

  return (
    <Route
      key={options.routeNode.matchPattern}
      element={
        <ServerFetchesProvider dataKey={options.routeNode.matchPattern}>
          <ComponentShardWrapper component={component} />

          {/*<ShardComponent shardPath={props.routeNode.shardPath} />*/}
        </ServerFetchesProvider>
      }
      path={options.routeNode.matchPattern}
      // path={props.routeNode.matchPattern.replace(props.routeNode.upperRouteMatchPattern, '').replace(/^\/?/, '/')}
    >
      {options.routeNode.children.map(routeNode =>
        GenerateSwiftRouteNode({
          routeNode: routeNode,
          loader: options.loader,
          routeDataMap: options.routeDataMap,
        }),
      )}
    </Route>
  );
};
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
