import { RenderPage } from "./page-renderer"
import { LunarServer } from "./lunar-server"
import { BuiltShardInfo, RouteNode, RouteNodeMap } from "../../lib/manifest"
import { CutOffQuery, GetUrlPath } from "./urlUtils"
import { ArrayClone } from "./array"
import {
  FetchingServerSideRouteData,
  ServerSideFetchResult,
  ServerSideRouteFetchResult,
} from "./fetch-server-side-route-data"
import { makeServerContext } from "./ssr-context"
import { UniversalRouteNode } from "../../lib/document-types"
import { IncomingMessage, ServerResponse } from "http"
import { join, resolve } from "path"
import { HTTPVersion, Instance as RouterInstance } from "find-my-way"
import { MutableHTTPHeaders } from "../../lib/http-headers.server"
import { ProductionMode } from "./constants"
import { writeFileToResponse } from "./write-file-with-response"
import { PathHelper } from "./helper/path"
import { ClientAppStructure } from "./client-app-structure"
import { PageParams } from "../../lib/lunar-context"
import { rawHeaderStringArrayToMutableHTTPHeaders } from "./http-header"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Router = require("find-my-way")

type RouteEntryNode = {
  children: RouteEntryNode[]
  shardInfo: BuiltShardInfo
  parent: RouteEntryNode
}

export function BuildRoutes(
  manifestRouteNodes: RouteNodeMap,
  appStructure: ClientAppStructure
): RouterInstance<HTTPVersion.V1> {
  const rootRouter = Router()

  rootRouter.on(
    "GET",
    "/static/*",
    async (req: IncomingMessage, res: ServerResponse) => {
      const urlPath = GetUrlPath(req.url!)
      const resolvedPath = resolve(urlPath.replace(/^\/static/, ""))

      const filePath = join(PathHelper.cwd, "/static/", resolvedPath)

      return writeFileToResponse(filePath, res)
    }
  )

  rootRouter.on(
    "GET",
    "/_/s/loader.js",
    async (req: IncomingMessage, res: ServerResponse) => {
      if (appStructure.Manifest.browserModuleLoaderFilePath) {
        return writeFileToResponse(
          PathHelper.GetDistFilePath(
            appStructure.Manifest.browserModuleLoaderFilePath
          ),
          res
        )
      }
      return res.writeHead(404).end()
    }
  )

  // source serve
  rootRouter.on(
    "GET",
    "/_/s/*",
    async (req: IncomingMessage, res: ServerResponse) => {
      const urlPath = GetUrlPath(req.url!)
      const shardPath = CutOffQuery(urlPath.replace(/^\/_\/s\//, ""))

      /**
       * Provides .map files in development mode
       */
      if (!ProductionMode) {
        const isMap = /\.map$/.test(shardPath)
        if (isMap) {
          const realShardPath = shardPath.replace(/\.map$/, "")
          const shard = appStructure.shards.get(realShardPath)
          if (shard && shard.IsPublicShard) {
            return writeFileToResponse(
              PathHelper.GetDistFilePath(shard.RealPath + ".map"),
              res
            )
          }
        }
      }

      const shard = appStructure.shards.get(shardPath)
      if (shard && shard.IsPublicShard) {
        return writeFileToResponse(
          PathHelper.GetDistFilePath(shard.RealPath),
          res
        )
      }

      return res.writeHead(404).end()
    }
  )

  const routePatterns = Object.keys(manifestRouteNodes)
  routePatterns.forEach((routePattern) => {
    const routeNode: RouteNode = manifestRouteNodes[routePattern]
    const terminalToRootOrderedNodeList = []

    /**
     * RouteNode 의 upperRoutePattern 을 따라
     * 상위 라우터를 모은다
     */
    for (let current = routeNode; current; ) {
      terminalToRootOrderedNodeList.push(current)
      if (current.upperRoutePattern) {
        current = manifestRouteNodes[current.upperRoutePattern]
      } else {
        break
      }
    }
    /**
     * beginToTerminalRouteStem
     * 최상위 라우트 부터 최종적으로 매치된 라우트와 그 사이 라우트노드를 포함한 라우트 노드 배열
     * "/blog/post" 에 매치 되고
     * "/blog"
     * "/blog/post"
     * 라우트가 존재 한다면
     *
     * ["/blog", "/blog/post"] 이 순서로 라우트 노드가 들어 있게 됨
     */
    const ascendFlatRouteNodeList = ArrayClone(
      terminalToRootOrderedNodeList
    ).reverse()

    rootRouter.on(
      "GET",
      routePattern,
      async (req: IncomingMessage, res: ServerResponse, params: PageParams) => {
        // req.
        console.log("Enter(URL):", req.url)
        /**
         * 나중엔 nested 라우트를 지원하기 위해 라우팅 트리 노드를 모아서 배열로 전달
         */
        const renderResult = await RenderPage(
          PathHelper.cwd,
          appStructure,
          req,
          params,
          ascendFlatRouteNodeList
        )

        res
          .writeHead(
            renderResult.status,
            renderResult.responseHeaders?.asObject()
          )
          .end(renderResult.data)
        return res
      }
    )

    /**
     * route 체크 및 SSR 데이터 로드 API
     */
    rootRouter.on(
      "GET", // @Todo: change to post
      "/_/r" + routePattern,
      async (req: IncomingMessage, res: ServerResponse, params: PageParams) => {
        // req.
        /**
         * 나중엔 nested 라우트를 지원하기 위해 라우팅 트리 노드를 모아서 배열로 전달
         */
        // const res = await RenderPage(swift.cwd, swift.webApp, req, params, ascendFlatRouteNodeList);
        // sid, sidss 체크 하기, sid 가 있어야 응답을 받을 수 있음

        /**
         * beginToTerminalRouteStem 을 universalNode 배열 로 변환
         */
        const ascendRouteNodeList: UniversalRouteNode[] =
          ascendFlatRouteNodeList.map((node) => ({
            // childNodes:[],
            matchPattern: node.routePattern,
            upperRouteMatchPattern: node.upperRoutePattern,
            shardPath: appStructure.Manifest.entries[node.entryPath].shardPath,
          }))

        const urlPath = GetUrlPath(req.url!).replace(/^\/_\/r/, "") // url 패스를 실제 page 패스에 맞추기 위해 앞의 "/_/r" 경로는 제거 한다

        const requestHeaders = rawHeaderStringArrayToMutableHTTPHeaders(
          req.rawHeaders
        )

        const responseHeaders = new MutableHTTPHeaders()
        responseHeaders.append("content-type", "application/json")

        const context = makeServerContext(
          req,
          urlPath,
          params,
          requestHeaders,
          responseHeaders
        )

        /**
         * _init.server.tsx 파일이 존재 한다면 먼저 처리 한다.
         */
        if (appStructure.Manifest.initServerShardPath) {
          const initServerScript: any =
            appStructure.LoadedEntryModuleMap[
              appStructure.Manifest.initServerShardPath
            ].default

          const ret: boolean = await initServerScript(context)
          //@Todo change response method
          if (!ret) {
            return res.writeHead(404, {}).end("error")
          }
        }

        const fetchedDataList: ServerSideFetchResult[] = []
        await Promise.all(
          ascendFlatRouteNodeList.map((routeNode) => {
            return new Promise((resolve, reject) => {
              ;(async function () {
                const result = await FetchingServerSideRouteData(
                  routeNode,
                  appStructure,
                  context
                )
                fetchedDataList.push(result)
                resolve(true)
              })()
            })
          })
        )

        const routeServerFetchesResultMap: {
          [pattern: string]: ServerSideRouteFetchResult | undefined
        } = {}

        /**
         * _app.server.tsx 파일이 있다면 해당 파일에 대한 처리
         */
        const serverSideAppEntryShardInfo =
          appStructure.Manifest.entries["app/routes/_app.server.tsx"]
        if (serverSideAppEntryShardInfo) {
          const appServerSideModule: any =
            appStructure.LoadedEntryModuleMap[
              serverSideAppEntryShardInfo.shardPath
            ]
          const appServerFetchFunction = appServerSideModule.serverFetches

          const appServerSideFetchResult = await appServerFetchFunction(context)
          routeServerFetchesResultMap["_app"] = appServerSideFetchResult
        }

        fetchedDataList.forEach((fetchedData) => {
          if (fetchedData) {
            const pattern = fetchedData.routerPattern
            const result = fetchedData.result

            routeServerFetchesResultMap[pattern] = result
          }
        })

        //@Todo change response method
        /**
         * 존재하는 라우트 경로로 정상적인 접근 시도를 했다면
         * 라우트 SSR 데이터와 라우트 정보를 응답한다.
         */
        return res.writeHead(200, responseHeaders.asObject()).end(
          JSON.stringify({
            data: routeServerFetchesResultMap,
            r: ascendRouteNodeList,
          })
        )
      }
    )
  })
  return rootRouter
}
