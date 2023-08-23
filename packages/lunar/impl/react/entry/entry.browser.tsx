import { hydrateRoot } from "react-dom/client"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import { RouteFetchResult, ServerFetchesProvider } from "../ssfetch"
import { UniversalRouteNode } from "../../../lib/document-types"
import LunarAppContainer, { SwiftRenderer } from "../app"
import { RootElementID } from "../../../lib/constants"

type ReactRouteNode = {
  element: React.ReactElement
  path: string
  children?: ReactRouteNode[]
}

type RequireFunction = (
  moduleNames: string[],
  callback: (modules: any[]) => void
) => void
type TAppData = {
  rd: {
    [routePattern: string]: RouteFetchResult
  }
  ascendRouteNodeList: UniversalRouteNode[]
}

function PromiseRequire(require: RequireFunction, modulePath: string): any {
  return new Promise((resolve) => {
    require([modulePath], ([module]) => {
      resolve(module)
    })
  })
}

export default function (
  appDataFromServer: TAppData,
  ascRouteNodes: UniversalRouteNode[],
  customAppEntryModulePath: string,
  require: RequireFunction
) {
  async function Startup() {
    let App: () => React.ReactElement
    console.log("customAppEntryModulePath", customAppEntryModulePath)
    if (customAppEntryModulePath) {
      console.log("Used customized App module")
      const customAppModule: any = await PromiseRequire(
        require,
        customAppEntryModulePath
      )
      App = customAppModule.default
    } else {
      App = () => <SwiftRenderer />
    }

    /**
     * 라우트 컴포넌트 딕셔너리
     */
    const routeComponents: { [shardPath: string]: any } = {}

    /**
     * 라우트 샤드 모듈을 미리 로드해서 routeComponents 에 저장 해두는 함수
     * 라우트이동시(navigate, popstate)에 호출 된다.
     * @param shardPaths
     */
    async function prepareRouteShards(shardPaths: string[]) {
      const loadedShards: {
        module?: { default: any }
        shardPath?: string
        skip?: boolean
      }[] = await Promise.all(
        shardPaths.map(async (shardPath) => {
          /**
           * 준비된 컴포넌트가 이미 있으면 skip 을 true 로
           */
          if (routeComponents[shardPath]) {
            return {
              skip: true,
            }
          }

          return {
            module: await PromiseRequire(require, shardPath),
            shardPath: shardPath,
          }
        })
      )

      for (let i = 0; i < loadedShards.length; i++) {
        const loadedShardInfo = loadedShards[i]
        if (
          loadedShardInfo &&
          loadedShardInfo.shardPath &&
          loadedShardInfo.module
        ) {
          routeComponents[loadedShardInfo.shardPath] =
            loadedShardInfo.module.default
        }
      }
    }
    await prepareRouteShards(
      ascRouteNodes.map((routeNode) => routeNode.shardPath)
    )

    // const nativeScrollTo = window.scrollTo;
    // window.scrollTo = (...args) => console.trace('scrollTo', args);

    const reactContainerEl = document.getElementById(RootElementID)
    if (reactContainerEl) {
      hydrateRoot(
        reactContainerEl,
        <React.StrictMode>
          <BrowserRouter>
            <LunarAppContainer
              enterLocation={{
                pathname: location.pathname,
                search: location.search,
                hash: location.hash,
              }}
              routeShardPrepareTrigger={prepareRouteShards}
              // 브라우저 사이드 샤드 로더 전달
              loader={(shardPath: string) => {
                return routeComponents[shardPath]
              }}
              ascendRouteNodeList={ascRouteNodes}
              dataMatchMap={appDataFromServer.rd}
            >
              <ServerFetchesProvider dataKey={"_app"}>
                <App />
              </ServerFetchesProvider>
            </LunarAppContainer>
          </BrowserRouter>
        </React.StrictMode>
      )
    }
  }

  Startup()
}
