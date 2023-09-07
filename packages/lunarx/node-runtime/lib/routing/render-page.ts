import { AppStructureContext } from "../client-app-structure"
import { GetUrlPath } from "../url-utils"
import { GenerateRandomBytes } from "../random"
import {
  DocumentPublicServerFetchesByPatternMap,
  UniversalRouteInfoNode,
} from "~/core/document-types"
import { RawRouteInfoNode, RawRouteInfoNodeMap } from "~/core/manifest"
import { makeServerContext } from "../make-server-context"
import { IncomingMessage } from "http"
import { EntryServerHandler } from "~/core/types.server"
import { MutableHTTPHeaders } from "~/core/http-headers.server"
import {
  PageParams,
  ServerErrorHandler,
  ServerSideFetchReturn,
} from "~/core/server-context"
import { rawHeaderStringArrayToMutableHTTPHeaders } from "../http-header"
import { executeServerEntry } from "./execute-server-entry"
import { preProcessPipelineForSsr } from "./pre-process-pipeline-for-ssr"
import { initServer } from "./init-server"
import { PublicServerSideFetchResult } from "~/core/context"
import { preProcessPipelineErrorHandleOfFetches } from "./pre-process-pipeline-error-handle-of-fetches"
import { rootErrorHandler } from "./root-error-handler"

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
      universalRouteInfoNodeList,
      requestHeaders,
      responseHeaders
    )

    const entryServerHandler: EntryServerHandler =
      appStructureContext.getModuleByAbsEntryName(
        INTERNAL_SERVER_ABS_ENTRY_NAME
      ).default

    const passOrThrownError = await initServer(context, appStructureContext)

    let errorHandleResult: PublicServerSideFetchResult<unknown> | null = null
    if (passOrThrownError !== true) {
      if (passOrThrownError.error) {
        errorHandleResult = await rootErrorHandler(
          context,
          appStructureContext,
          passOrThrownError
        )
      } else {
        console.error(
          "Error occurs from `init.server` but It wasn't handle.",
          passOrThrownError
        )
        return {
          data: "Unexpected error",
          status: 500,
          responseHeaders: new MutableHTTPHeaders(),
        }
      }
    }

    const routeServerFetchesResultMap = await preProcessPipelineForSsr(
      context,
      appStructureContext,
      rawRouteInfoNodeListRootToLeaf
    )

    // handle(filter) error from preProcessPipelineForSsr
    const documentPublicServerFetchesByPatternMap: DocumentPublicServerFetchesByPatternMap =
      await preProcessPipelineErrorHandleOfFetches(
        context,
        appStructureContext,
        routeServerFetchesResultMap
      )

    return {
      /**
       * entry.server 를 호출 해 페이지 데이터를 생성
       */
      data: await executeServerEntry(
        entryServerHandler,
        errorHandleResult,
        context,
        appStructureContext,
        documentPublicServerFetchesByPatternMap,
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
    console.log("Unexpected error during render page", e)
  }

  return {
    data: "Unexpected error",
    status: 500,
    responseHeaders: new MutableHTTPHeaders(),
  }
}