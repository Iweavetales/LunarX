import { ClientAppStructure } from "./client-app-structure"
import { GetUrlPath } from "./urlUtils"
import { GenerateRandomBytes } from "./random"
import { DocumentSheet, UniversalRouteNode } from "../../lib/document-types"
import { BuiltShardInfo, RouteNode, RouteNodeMap } from "../../lib/manifest"
import {
  FetchingServerSideRouteData,
  ServerSideFetchResult,
  ServerSideRouteFetchResult,
} from "./fetch-server-side-route-data"
import { makeSwiftContext } from "./ssr-context"
import { IncomingMessage } from "http"
import { EntryServerHandler } from "../../lib/types.server"
import { HTTPHeaders } from "../../lib/http-headers.server"
import { PageParams } from "../../lib/lunar-context"
import axios from "axios"

export function RenderPage(
  currentWorkDirectory: string,
  webApp: ClientAppStructure,
  req: IncomingMessage,
  params: PageParams,
  /**
   * beginToTerminalRouteStem
   * 최상위 라우트 부터 최종적으로 매치된 라우트와 그 사이 라우트노드를 포함한 라우트 노드 배열
   * "/blog/post" 에 매치 되고
   *
   * "/blog"
   * "/blog/post"
   * 라우트가 존재 한다면
   *
   * ["/blog", "/blog/post"] 이 순서로 라우트 노드가 들어 있게 됨
   */
  ascendFlatRouteNodeList: RouteNode[]
): Promise<{
  data?: string
  status: number
  responseHeaders?: HTTPHeaders
}> {
  // beginToTerminalRouteStem 의 역순으로 라우트 노드를 배열
  // const reverseRouteStem = ArrayClone(ascendFlatRouteNodeList).reverse();

  /**
   * 모든 라우트 노드들을 조회 하며
   * 모든 라우터가 포함된 라우트 맵이 아닌
   * 현재 매치된 라우트의 길만 포함 하는 라우트 노드 목록 생성
   */
  const routeNodeMap: RouteNodeMap = {}
  for (let i = 0; i < ascendFlatRouteNodeList.length; i++) {
    const routeNode = ascendFlatRouteNodeList[i]
    routeNodeMap[routeNode.routePattern] = routeNode
  }

  /**
   * beginToTerminalRouteStem 을 universalNode 배열 로 변환
   */
  const ascendRouteNodeList: UniversalRouteNode[] | unknown =
    ascendFlatRouteNodeList.map((node) => ({
      // childNodes:[],
      matchPattern: node.routePattern,
      upperRouteMatchPattern: node.upperRoutePattern,
      shardPath: webApp.Manifest.entries[node.entryPath ?? "??"].shardPath,
    }))

  const entriesArray = Object.keys(webApp.Manifest.entries).map(
    (key) => webApp.Manifest.entries[key]
  )

  const routerServerEntrySource: BuiltShardInfo | undefined = entriesArray.find(
    (entry) => entry.entryName === "router.server"
  )
  const entryServerEntrySource: BuiltShardInfo | undefined = entriesArray.find(
    (entry) => entry.entryName === "entry.server"
  )
  if (!(routerServerEntrySource && entryServerEntrySource)) {
    return Promise.resolve({
      data: "Not found core",
      status: 200,
    })
  }

  return new Promise((resolve, reject) => {
    async function process() {
      try {
        /**
         * 편집 가능한 request header 를 만들기 위해 req.header 를 requestHeader 로 복사 한다
         */
        const requestHeaders = new HTTPHeaders()
        const rawHeaders = req.rawHeaders
        const headerCount = rawHeaders.length / 2

        for (let i = 0; i < headerCount; i++) {
          const headerPosition = i * 2
          const headerName = rawHeaders[headerPosition]
          const headerValue = rawHeaders[headerPosition + 1]

          requestHeaders.append(headerName, headerValue || "")
        }

        const responseHeaders = new HTTPHeaders()
        responseHeaders.append("content-type", "text/html; charset=utf-8")

        const urlPath = GetUrlPath(req.url!)
        const context = makeSwiftContext(
          req,
          urlPath,
          params,
          requestHeaders,
          responseHeaders
        )

        const entryServerHandler: EntryServerHandler =
          webApp.LoadedEntryModuleMap[entryServerEntrySource!.shardPath].default
        const routerServerHandler: any =
          webApp.LoadedEntryModuleMap[routerServerEntrySource!.shardPath]
            .default

        try {
          /**
           * _init.server.tsx 파일이 존재 한다면 먼저 처리 한다.
           */
          if (webApp.Manifest.initServerShardPath) {
            const initServerScript: any =
              webApp.LoadedEntryModuleMap[webApp.Manifest.initServerShardPath]
                .default

            const ret: boolean = await initServerScript(context)
            if (!ret) {
              return resolve({
                data: "error",
                status: 404,
                responseHeaders: context.responseHeaders,
              })
            }
          }
        } catch (e) {
          console.error("Failed to server side fetch data from _init.server")
          console.error(e)
          return resolve({
            data: "",
            status: 500,
            responseHeaders: context.responseHeaders,
          })
        }

        function getRouteModule(pattern: string): any {
          console.log("getRouteModule", pattern, webApp.LoadedEntryModuleMap)

          return webApp.LoadedEntryModuleMap[
            webApp.Manifest.entries[
              webApp.Manifest.routeNodes[pattern].entryPath ?? "??"
            ].shardPath
          ].default
        }

        function requireFunction(shardPath: string): any {
          return webApp.LoadedEntryModuleMap[shardPath].default
        }

        /**
         * 라우트 노드별 serverFetches 를 실행 하여  데이터를 각각 로딩
         * execute serial
         */
        const fetchedDataList: ServerSideFetchResult[] = []

        try {
          await Promise.all(
            ascendFlatRouteNodeList.map((routeNode) => {
              return new Promise((resolve, reject) => {
                ;(async function () {
                  const result = await FetchingServerSideRouteData(
                    routeNode,
                    webApp,
                    context
                  )

                  fetchedDataList.push(result)
                  resolve(true)
                })()
              })
            })
          )
        } catch (e) {
          console.error("Failed to server side fetch data")
          console.error(e)
          return resolve({
            data: "",
            status: 500,
            responseHeaders: context.responseHeaders,
          })
        }

        // console.log("fetchedDataList", fetchedDataList)
        const routeServerFetchesResultMap: {
          [pattern: string]: ServerSideRouteFetchResult | undefined
        } = {}

        /**
         * 위에서 로드 한 데이터를 결과 맵에 바인딩 한다
         */
        fetchedDataList.forEach((fetchedData) => {
          if (fetchedData) {
            const pattern = fetchedData.routerPattern
            const result = fetchedData.result

            routeServerFetchesResultMap[pattern] = result
          }
        })

        /**
         * _app.server.tsx 파일이 있다면 해당 파일에 대한 처리
         */
        try {
          const serverSideAppEntryShardInfo =
            webApp.Manifest.entries["app/routes/_app.server.tsx"]
          if (serverSideAppEntryShardInfo) {
            const appServerSideModule: any =
              webApp.LoadedEntryModuleMap[serverSideAppEntryShardInfo.shardPath]
            const appServerFetchFunction = appServerSideModule.serverFetches

            const appServerSideFetchResult = await appServerFetchFunction(
              context
            )
            routeServerFetchesResultMap["_app"] = appServerSideFetchResult
          }
        } catch (e) {
          console.error("Failed to server side fetch _app.server data", e)
          return resolve({
            data: "",
            status: 500,
            responseHeaders: context.responseHeaders,
          })
        }

        // console.log("routeNodeMap", routeNodeMap)

        /**
         * router.server.tsx 를 실행해 리액트 라우터 컴포넌트 트리를 생성한다
         */
        const router = await routerServerHandler(
          context,
          routeNodeMap,
          getRouteModule
        )

        try {
          /**
           * 랜덤 바이트 16개를 base64 로 인코딩 해서 nonce 생성
           */
          const nonce = btoa(GenerateRandomBytes(16))

          /**
           * entry.server.ts 를 호출 해 페이지 데이터를 생성
           */
          const result = await entryServerHandler(
            context,
            {
              scripts: webApp.OrderedBrowserScriptShards.map(
                (shardPath: string) => {
                  return {
                    url:
                      "/_/s/" +
                      shardPath +
                      "?v=" +
                      webApp.Manifest.builtVersion,
                  }
                }
              ),
              styles: webApp.OrderedBrowserStyleShards.map(
                (shardPath: string) => {
                  return {
                    url:
                      "/_/s/" +
                      shardPath +
                      "?v=" +
                      webApp.Manifest.builtVersion,
                  }
                }
              ),
              nonce: nonce,
              loaderScriptUrl:
                "/_/s/loader.js" + "?v=" + webApp.Manifest.builtVersion,
              browserEntryModulePath: webApp.Manifest.browserEntryShardPath,
              customAppModuleShardPath: webApp.Manifest.customizeAppShardPath,
              customDocumentModuleShardPath:
                webApp.Manifest.customizeServerDocumentShardPath,

              // server side fetched 데이터 맵
              routeServerFetchesResultMap: routeServerFetchesResultMap,
              // 오름차순 정렬 라우트 노드 정보
              ascendRouteNodeList: ascendRouteNodeList,

              // 모듈 로드 함수
              requireFunction: requireFunction,
            } as DocumentSheet,
            router
          )

          console.log("response lunar page")

          /**
           * Response 객체 생성
           */
          resolve({
            data: result,
            status: 200,
            responseHeaders: responseHeaders,
          })
        } catch (e) {
          console.log("module load error>", e)
        }
      } catch (e) {
        console.log("failed to load base libs", e)
      }

      return resolve({
        data: "",
        status: 500,
        responseHeaders: new HTTPHeaders(),
      })
    }

    process()
  })
}
