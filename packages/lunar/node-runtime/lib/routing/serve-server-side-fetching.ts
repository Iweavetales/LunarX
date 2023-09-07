import { IncomingMessage, ServerResponse } from "http"
import { PageParams, ServerSideFetchReturn } from "~/core/server-context"
import { AppRouteInstanceContext } from "./app-route-instance-context"
import { GetUrlPath } from "../url-utils"
import { rawHeaderStringArrayToMutableHTTPHeaders } from "../http-header"
import { MutableHTTPHeaders } from "~/core/http-headers.server"
import { makeServerContext } from "../make-server-context"
import { initServer } from "./init-server"
import { preProcessPipelineForSsr } from "./pre-process-pipeline-for-ssr"

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
    responseHeaders
  )

  const initServerResult = await initServer(
    context,
    appRouteInstanceContext.appStructureContext
  )
  if (initServerResult !== true && initServerResult.error) {
    //
  }

  const routeServerFetchesResultMap = await preProcessPipelineForSsr(
    context,
    appRouteInstanceContext.appStructureContext,
    appRouteInstanceContext.rawRouteInfoNodeListRootToLeaf
  )

  //@Todo change response method
  /**
   * 존재하는 라우트 경로로 정상적인 접근 시도를 했다면
   * 라우트 SSR 데이터와 라우트 정보를 응답한다.
   */
  return res.writeHead(200, responseHeaders.asObject()).end(
    JSON.stringify({
      data: routeServerFetchesResultMap,
      r: appRouteInstanceContext.universalRouteInfoNodeList,
    })
  )
}
