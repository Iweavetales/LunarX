import { AppStructureContext } from "./client-app-structure"
import { GetUrlPath } from "./url-utils"
import { GenerateRandomBytes } from "./random"
import { DocumentSheet, UniversalRouteInfoNode } from "~/core/document-types"
import {
  BuiltShardInfo,
  RawRouteInfoNode,
  RawRouteInfoNodeMap,
} from "~/core/manifest"
import {
  FetchingServerSideRouteData,
  ServerSideFetchResult,
  ServerSideRouteFetchResult,
} from "./fetch-server-side-route-data"
import { makeServerContext } from "./make-server-context"
import { IncomingMessage } from "http"
import { EntryServerHandler } from "~/core/types.server"
import { MutableHTTPHeaders } from "~/core/http-headers.server"
import { PageParams } from "~/core/lunar-context"
import { rawHeaderStringArrayToMutableHTTPHeaders } from "./http-header"

export function RenderPage(
  currentWorkDirectory: string,
  webApp: AppStructureContext,
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
  rawRouteInfoNodeListRootToLeaf: RawRouteInfoNode[],
  universalRouteInfoNodeList: UniversalRouteInfoNode[]
): Promise<{
  data?: string
  status: number
  responseHeaders?: MutableHTTPHeaders
}> {
  // beginToTerminalRouteStem 의 역순으로 라우트 노드를 배열
  // const reverseRouteStem = ArrayClone(ascendFlatRouteNodeList).reverse();

  /**
   * 모든 라우트 노드들을 조회 하며
   * 모든 라우터가 포함된 라우트 맵이 아닌
   * 현재 매치된 라우트의 길만 포함 하는 라우트 노드 목록 생성
   */
  const routeNodeMap: RawRouteInfoNodeMap = {}
  for (let i = 0; i < rawRouteInfoNodeListRootToLeaf.length; i++) {
    const routeNode = rawRouteInfoNodeListRootToLeaf[i]
    routeNodeMap[routeNode.routePattern] = routeNode
  }

  const entriesArray = Object.keys(webApp.Manifest.entries).map(
    (key) => webApp.Manifest.entries[key]
  )

  const entryServerEntrySource: BuiltShardInfo | undefined = entriesArray.find(
    (entry) => entry.entryName === "entry.server"
  )
  if (entryServerEntrySource) {
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

        const requestHeaders = rawHeaderStringArrayToMutableHTTPHeaders(
          req.rawHeaders
        )
        const responseHeaders = new MutableHTTPHeaders()
        responseHeaders.append("content-type", "text/html; charset=utf-8")

        const urlPath = GetUrlPath(req.url!)
        const context = makeServerContext(
          req,
          urlPath,
          params,
          requestHeaders,
          responseHeaders
        )

        const entryServerHandler: EntryServerHandler =
          webApp.LoadedEntryModuleMap[entryServerEntrySource!.shardPath].default

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
              webApp.Manifest.routeInfoNodes[pattern].entryPath ?? "??"
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
            rawRouteInfoNodeListRootToLeaf.map((routeNode) => {
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

        /**
         * 랜덤 바이트 16개를 base64 로 인코딩 해서 nonce 생성
         */
        const nonce = btoa(GenerateRandomBytes(16))

        /**
         * entry.server.ts 를 호출 해 페이지 데이터를 생성
         */
        const result = await entryServerHandler(context, {
          scripts: webApp.OrderedBrowserScriptShards.map(
            (shardPath: string) => {
              return {
                url: "/_/s/" + shardPath + "?v=" + webApp.Manifest.builtVersion,
              }
            }
          ),
          styles: webApp.OrderedBrowserStyleShards.map((shardPath: string) => {
            return {
              url: "/_/s/" + shardPath + "?v=" + webApp.Manifest.builtVersion,
            }
          }),
          nonce: nonce,
          loaderScriptUrl:
            "/_/s/loader.js" + "?v=" + webApp.Manifest.builtVersion,
          browserEntryModulePath: webApp.Manifest.browserEntryShardPath,
          customAppModuleShardPath: webApp.Manifest.customizeAppShardPath,
          custom404ShardPath: webApp.Manifest.customize404ShardPath,
          customErrorShardPath: webApp.Manifest.customizeErrorShardPath,
          customDocumentModuleShardPath:
            webApp.Manifest.customizeServerDocumentShardPath,

          // server side fetched 데이터 맵
          routeServerFetchesResultMap: routeServerFetchesResultMap,
          // 오름차순 정렬 라우트 노드 정보
          universalRINListRootToLeaf: universalRouteInfoNodeList,
          // 모듈 로드 함수
          requireFunction: requireFunction,
        } as DocumentSheet)

        /**
         * Response 객체 생성
         */
        resolve({
          data: result,
          status: 200,
          responseHeaders: responseHeaders,
        })
      } catch (e) {
        console.log("failed to load base libs", e)
      }

      return resolve({
        data: "",
        status: 500,
        responseHeaders: new MutableHTTPHeaders(),
      })
    }

    process()
  })
}
