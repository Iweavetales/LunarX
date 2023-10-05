import { hydrateRoot } from "react-dom/client"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import lz from "lz-string"
import { UniversalRouteInfoNode } from "~/core/document-types"
import LunarAppContainer from "../lib/root-app-container"
import { RootElementID } from "~/core/constants"
import { SwiftRenderer } from "../app"
import { ServerFetchesProvider } from "../lib/server-fetches-provider"
import { TAppData } from "../lib/app-data"
import DefaultNotFoundPage from "./_404.default"
import DefaultErrorComponent from "./_error.default"
import { PublicErrorInfo } from "~/core/context"
type ReactRouteNode = {
  element: React.ReactElement
  path: string
  children?: ReactRouteNode[]
}

type RequireFunction = (
  moduleNames: string[],
  callback: (modules: any[]) => void
) => void

function PromiseRequire(
  require: RequireFunction,
  modulePath: string
): Promise<any> {
  return new Promise((resolve) => {
    require([modulePath], ([module]) => {
      resolve(module)
    })
  })
}

export default function (
  require: RequireFunction,
  appDataStringFromServer: string,
  ascRouteNodes: UniversalRouteInfoNode[],
  customAppEntryModulePath: string,
  browserEntryModulePath: string,
  initScriptShardPathDependencies: string[],
  initStyleShardPathDependencies: string[],
  custom404RouteShardPath?: string,
  customErrorRouteShardPath?: string,
  initError?: PublicErrorInfo | null
) {
  let appDataFromServer = {}
  // eslint-disable-next-line no-undef
  if (COMPRESSING_SSR_DATA) {
    process.env.NODE_ENV !== "production" &&
      console.time("server data decompress time")
    appDataFromServer = JSON.parse(
      lz.decompressFromBase64(appDataStringFromServer)
    )
    process.env.NODE_ENV !== "production" &&
      console.timeEnd("server data decompress time")
  } else {
    process.env.NODE_ENV !== "production" &&
      console.time("server data parsing time")
    appDataFromServer = JSON.parse(atob(appDataStringFromServer))
    process.env.NODE_ENV !== "production" &&
      console.timeEnd("server data parsing time")
  }

  async function Startup() {
    let App: () => React.ReactElement

    if (customAppEntryModulePath) {
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

    let notFoundComponent: React.FunctionComponent
    if (custom404RouteShardPath) {
      notFoundComponent = (
        await PromiseRequire(require, custom404RouteShardPath)
      ).default
    } else {
      notFoundComponent = DefaultNotFoundPage
    }

    let errorComponent: React.FunctionComponent
    if (customErrorRouteShardPath) {
      errorComponent = (
        await PromiseRequire(require, customErrorRouteShardPath)
      ).default
    } else {
      errorComponent = DefaultErrorComponent
    }

    const preloadedComponents = await Promise.all(
      /**
       * Resolves [shardPath, React.FunctionComponent]
       */
      ascRouteNodes.map(async (routeNode) => [
        routeNode.shardPath,
        (await PromiseRequire(require, routeNode.shardPath)).default,
      ])
    ).then((pairs) =>
      /**
       * Reduce [[shardPath, React.FunctionComponent], ...] -> { ... }
       */
      pairs.reduce((acc, cur) => ({ ...acc, [cur[0]]: cur[1] }), {})
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
              initError={initError}
              enterLocation={{
                pathname: location.pathname,
                search: location.search,
                hash: location.hash,
              }}
              routeShardPrepareTrigger={prepareRouteShards}
              // 브라우저 사이드 샤드 로더 전달
              loader={(shardPath: string) => {
                return PromiseRequire(require, shardPath)
              }}
              ascendRouteNodeList={ascRouteNodes}
              dataMatchMap={appDataFromServer.rd}
              preloadedComponents={preloadedComponents}
              notFoundComponent={notFoundComponent}
              errorComponent={errorComponent}
            >
              <ServerFetchesProvider
                dataKey={"_app"}
                directProvidedFetchResult={appDataFromServer.rd["_app"]}
              >
                <App />
              </ServerFetchesProvider>
            </LunarAppContainer>
          </BrowserRouter>
        </React.StrictMode>
      )
    }
  }

  // # defined by esbuild
  // eslint-disable-next-line no-undef
  if (DEFINE_ENABLE_FAST_REFRESH) {
    // socket
    const socket = new WebSocket(`ws://${location.host}/_hmr`)

    socket.addEventListener("open", (event) => {
      console.log("Socket Connected", socket)
    })
    // Listen for messages
    socket.addEventListener("message", (event) => {
      console.log("Message from server ", event.data)
      try {
        const message = JSON.parse(event.data)
        const messageType = message.type
        console.log("build server message", message)
        if (messageType === "updated-sources") {
          const updatedShards: string[] = message.updatedShardPaths
          console.log("updated", updatedShards)
          location.reload()

          // holding for Fast Refresh
          return
          Promise.all(
            updatedShards.map(async (shardPath: string) => {
              const sourceResponse = await fetch(`/_/s/${shardPath}`)
              console.log(shardPath, "source", sourceResponse)
              if (sourceResponse.body) {
                const reader = sourceResponse.body.getReader()
                const { done, value } = await reader.read()

                const source = new TextDecoder().decode(value)
                console.log(done, source)
                try {
                  eval(source)
                } catch (e) {
                  console.error("eval error", e)
                }
              }
            })
          ).then(() => {
            console.log("Hot Update", browserEntryModulePath)
            require([browserEntryModulePath], function (modules) {
              modules[0].default(
                appDataFromServer,
                ascRouteNodes,
                customAppEntryModulePath,
                browserEntryModulePath,
                require
              )
            })
          })
        }
      } catch (e) {
        console.error("Failed to parse message", e)
      }
    })

    socket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event)
    })

    socket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event)
    })
  }

  Startup()
}
