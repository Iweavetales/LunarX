import { IncomingMessage, ServerResponse } from "http"
import { PageParams } from "~/core/server-context"
import { AppRouteInstanceContext } from "./app-route-instance-context"
import { GetUrlPath } from "../url-utils"
import { rawHeaderStringArrayToMutableHTTPHeaders } from "../http-header"
import { MutableHTTPHeaders } from "~/core/http-headers.server"
import { makeServerContext } from "../make-server-context"
import { initServer } from "./init-server"
import { preProcessPipelineForSsr } from "./pre-process-pipeline-for-ssr"
import { DocumentPublicServerFetchesByPatternMap } from "~/core/document-types"
import { preProcessPipelineErrorHandleOfFetches } from "./pre-process-pipeline-error-handle-of-fetches"
import { PublicServerSideFetchResult } from "~/core/context"
import { rootErrorHandler } from "./root-error-handler"
import { PageResourceBuilder } from "../helper/page-resource-builder"

export const serveServerSideFetching = async (
  req: IncomingMessage,
  res: ServerResponse,
  params: PageParams,
  appRouteInstanceContext: AppRouteInstanceContext
) => {
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
    appRouteInstanceContext.universalRouteInfoNodeList,
    requestHeaders,
    responseHeaders,
    ""
  )

  const passOrThrownError = await initServer(
    context,
    appRouteInstanceContext.appStructureContext
  )

  let errorHandleResult: PublicServerSideFetchResult<unknown> | null = null
  if (passOrThrownError !== true) {
    if (passOrThrownError.error) {
      errorHandleResult = await rootErrorHandler(
        context,
        appRouteInstanceContext.appStructureContext,
        passOrThrownError
      )

      return res.writeHead(200, responseHeaders.asObject()).end(
        JSON.stringify({
          initError: errorHandleResult.error,
        })
      )
    } else {
      console.error(
        "Error occurs from `init.server` but It wasn't handle.",
        passOrThrownError
      )

      return res.writeHead(500, {}).end("Unexpected error")
    }
  }

  const routeServerFetchesResultMap = await preProcessPipelineForSsr(
    context,
    appRouteInstanceContext.appStructureContext,
    appRouteInstanceContext.rawRouteInfoNodeListRootToLeaf
  )

  const pageResourceBuilder = new PageResourceBuilder(
    appRouteInstanceContext.appStructureContext
  )
  // Extract shard resources from current routes
  appRouteInstanceContext.universalRouteInfoNodeList.forEach((routeNode) => {
    pageResourceBuilder.pushShard(routeNode.shardPath)
  })

  // handle(filter) error from preProcessPipelineForSsr
  const documentPublicServerFetchesByPatternMap: DocumentPublicServerFetchesByPatternMap =
    await preProcessPipelineErrorHandleOfFetches(
      context,
      appRouteInstanceContext.appStructureContext,
      routeServerFetchesResultMap
    )

  return res.writeHead(200, responseHeaders.asObject()).end(
    JSON.stringify({
      data: documentPublicServerFetchesByPatternMap,
      r: appRouteInstanceContext.universalRouteInfoNodeList,
      a: [...pageResourceBuilder.dependingScripts.values()],
      d: [...pageResourceBuilder.dependingStyles.values()],
    })
  )
}
