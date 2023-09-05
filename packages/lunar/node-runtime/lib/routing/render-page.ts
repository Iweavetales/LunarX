import { AppStructureContext } from "../client-app-structure"
import { GetUrlPath } from "../url-utils"
import { GenerateRandomBytes } from "../random"
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
} from "../fetch-server-side-route-data"
import { makeServerContext } from "../make-server-context"
import { IncomingMessage } from "http"
import { EntryServerHandler } from "~/core/types.server"
import { MutableHTTPHeaders } from "~/core/http-headers.server"
import { PageParams } from "~/core/lunar-context"
import { rawHeaderStringArrayToMutableHTTPHeaders } from "../http-header"
import { executeServerEntry } from "./execute-server-entry"

const INTERNAL_SERVER_ABS_ENTRY_NAME = "@entry/entry.server"

export async function renderPage(
  currentWorkDirectory: string,
  appStructureContext: AppStructureContext,
  req: IncomingMessage,
  params: PageParams,
  /**
   * rawRouteInfoNodeListRootToLeaf
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
      appStructureContext.getModuleByAbsEntryName(
        INTERNAL_SERVER_ABS_ENTRY_NAME
      ).default

    try {
      /**
       * _init.server.tsx 파일이 존재 한다면 먼저 처리 한다.
       */
      if (appStructureContext.hasEntryByAbsEntryName("/_init.server")) {
        const initServerScript: any =
          appStructureContext.getModuleByAbsEntryName("/_init.server").default

        const ret: boolean = await initServerScript(context)
        if (!ret) {
          return {
            data: "error",
            status: 404,
            responseHeaders: context.responseHeaders,
          }
        }
      }
    } catch (e) {
      console.error("Failed to server side fetch data from _init.server")
      console.error(e)
      return {
        data: "",
        status: 500,
        responseHeaders: context.responseHeaders,
      }
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
                appStructureContext,
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
      return {
        data: "",
        status: 500,
        responseHeaders: context.responseHeaders,
      }
    }

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
      if (appStructureContext.hasEntryByAbsEntryName("/_app.server")) {
        const appServerSideModule: any =
          appStructureContext.getModuleByAbsEntryName("/_app.server")

        const appServerFetchFunction = appServerSideModule.serverFetches

        const appServerSideFetchResult = await appServerFetchFunction(context)
        routeServerFetchesResultMap["_app"] = appServerSideFetchResult
      }
    } catch (e) {
      console.error("Failed to server side fetch _app.server data", e)
      return {
        data: "",
        status: 500,
        responseHeaders: context.responseHeaders,
      }
    }

    return {
      /**
       * entry.server 를 호출 해 페이지 데이터를 생성
       */
      data: await executeServerEntry(
        entryServerHandler,
        context,
        appStructureContext,
        routeServerFetchesResultMap,
        universalRouteInfoNodeList,
        /**
         * 랜덤 바이트 16개를 base64 로 인코딩 해서 nonce 생성
         */
        btoa(GenerateRandomBytes(16))
      ),
      status: 200,
      responseHeaders: responseHeaders,
    }
  } catch (e) {
    console.log("failed to load base libs", e)
  }

  return {
    data: "",
    status: 500,
    responseHeaders: new MutableHTTPHeaders(),
  }
}
