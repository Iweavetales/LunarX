import { IncomingMessage, ServerResponse } from "http"
import { PageParams } from "~/core/server-context"
import { AutoResponse, renderPage } from "./render-page"
import { PathHelper } from "../helper/path"
import { AppRouteInstanceContext } from "./app-route-instance-context"

export const serveServerSideRendering = async (
  req: IncomingMessage,
  res: ServerResponse,
  params: PageParams,
  appRouteInstanceContext: AppRouteInstanceContext
) => {
  // req.
  console.log("Enter(URL):", req.url)
  /**
   * 나중엔 nested 라우트를 지원하기 위해 라우팅 트리 노드를 모아서 배열로 전달
   */
  const renderResult = await renderPage(
    PathHelper.cwd,
    appRouteInstanceContext.appStructureContext,
    req,
    res,
    params,
    appRouteInstanceContext.rawRouteInfoNodeListRootToLeaf,
    appRouteInstanceContext.universalRouteInfoNodeList
  )

  const typeOfResult = typeof renderResult
  if (typeOfResult === "boolean") {
    return
  } else if (typeOfResult === "object") {
    const autoResponse = renderResult as AutoResponse
    res
      .writeHead(autoResponse.status, autoResponse.responseHeaders?.asObject())
      .end(autoResponse.data)
  }

  return res
}
