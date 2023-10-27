import { hydrateRoot } from "react-dom/client"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import lz from "lz-string"
import { UniversalRouteInfoNode } from "~/core/document-types"
import LunarAppContainer from "../lib/root-app-container"
import { RootElementID } from "~/core/constants"
import { SwiftRenderer } from "../app"
import { ServerFetchesProvider } from "../lib/server-fetches-provider"
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
  callback: (modules: any[]) => void,
  from: string | null,
  nonce: string | null,
  moduleUrlHint: (name: string) => string
) => void

export default function (
  require: RequireFunction,
  appDataStringFromServer: string,
  ascRouteNodes: UniversalRouteInfoNode[],
  customAppEntryModulePath: string,
  browserEntryModulePath: string,
  initScriptShardPathDependencies: string[],
  initStyleShardPathDependencies: string[],
  nonce: string | null,
  builtVersion: string,
  custom404RouteShardPath?: string,
  customErrorRouteShardPath?: string,
  initError?: PublicErrorInfo | null
) {
  function shardPathToResourceUrlPath(shardPath: string): string {
    return `/_/s/${shardPath}?v=${builtVersion}`
  }

  function PromiseRequire(
    require: RequireFunction,
    modulePath: string,
    nonce: string | null
  ): Promise<any> {
    return new Promise((resolve) => {
      // console.log("PromiseRequire", modulePath)
      require([modulePath], ([module]) => {
        // console.log("PromiseRequire done", modulePath, module)
        resolve(module)
      }, null, nonce, (moduleName) => shardPathToResourceUrlPath(moduleName))
    })
  }

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
    appDataFromServer = appDataStringFromServer
  }

  async function Startup() {
    let App: () => React.ReactElement

    if (customAppEntryModulePath) {
      const customAppModule: any = await PromiseRequire(
        require,
        customAppEntryModulePath,
        nonce
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
      /**
       * Filtering already loaded module
       */
      const filteredModuleNames = shardPaths.filter((shardPath) => {
        if (routeComponents[shardPath]) {
          return false
        }
        return true
      })

      const loadedModules: {
        module?: { default: any }
        shardPath?: string
      }[] = await new Promise((resolve) => {
        require(filteredModuleNames, (modules) => {
          resolve(modules)
        }, null, nonce, (moduleName) => shardPathToResourceUrlPath(moduleName))
      })

      for (let i = 0; i < loadedModules.length; i++) {
        const loadedShardInfo = loadedModules[i]
        const moduleName = filteredModuleNames[i]
        if (
          loadedShardInfo &&
          loadedShardInfo.shardPath &&
          loadedShardInfo.module
        ) {
          routeComponents[moduleName] = loadedShardInfo.module.default
        }
      }
    }
    await prepareRouteShards(
      ascRouteNodes.map((routeNode) => routeNode.shardPath)
    )

    let notFoundComponent: React.FunctionComponent
    if (custom404RouteShardPath) {
      notFoundComponent = (
        await PromiseRequire(require, custom404RouteShardPath, nonce)
      ).default
    } else {
      notFoundComponent = DefaultNotFoundPage
    }

    let errorComponent: React.FunctionComponent
    if (customErrorRouteShardPath) {
      errorComponent = (
        await PromiseRequire(require, customErrorRouteShardPath, nonce)
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
        (await PromiseRequire(require, routeNode.shardPath, nonce)).default,
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
                if (/\.js$/.test(shardPath)) {
                  return PromiseRequire(require, shardPath, nonce)
                } else if (/\.css$/.test(shardPath)) {
                  //
                }
              }}
              preload={(shardPath: string, type: "script" | "style") => {
                const resourceURL = shardPathToResourceUrlPath(shardPath)
                if (
                  !document.head.querySelector(
                    `link[href='${resourceURL}'][rel='preload']`
                  )
                ) {
                  /**
                   * If the resource is already present, it won't preload to prevent duplication.
                   */
                  if (type === "style") {
                    if (
                      document.querySelector(`link[href^='${resourceURL}']`)
                    ) {
                      return
                    }
                  }
                  if (type === "script") {
                    if (
                      document.querySelector(`script[src^='${resourceURL}']`)
                    ) {
                      return
                    }
                  }

                  const preloadLink = document.createElement("link")
                  preloadLink.href = resourceURL
                  preloadLink.nonce = nonce ?? ""
                  preloadLink.rel = "preload"
                  preloadLink.as = type
                  document.head.appendChild(preloadLink)

                  if (type === "style") {
                    const preloadLink = document.createElement("link")
                    preloadLink.href = resourceURL
                    preloadLink.nonce = nonce ?? ""
                    preloadLink.rel = "stylesheet"
                    document.head.appendChild(preloadLink)
                  }
                }

                return
              }}
              ascendRouteNodeList={ascRouteNodes}
              dataMatchMap={appDataFromServer.rd}
              preloadedComponents={preloadedComponents}
              notFoundComponent={notFoundComponent}
              errorComponent={errorComponent}
              initScriptShardPathDependencies={initScriptShardPathDependencies}
              initStyleShardPathDependencies={initStyleShardPathDependencies}
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
