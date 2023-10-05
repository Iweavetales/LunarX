import { IncomingMessage, ServerResponse } from "http"
import { PageParams } from "~/core/server-context"
import { AutoResponse, renderPage } from "./render-page"
import { PathHelper } from "../helper/path"
import { AppRouteInstanceContext } from "./app-route-instance-context"
import { PageResourceBuilder } from "../helper/page-resource-builder"

export const serveServerSideRendering = async (
  req: IncomingMessage,
  res: ServerResponse,
  params: PageParams,
  appRouteInstanceContext: AppRouteInstanceContext
) => {
  console.log("Enter(URL):", req.url)

  const pageResourceBuilder = new PageResourceBuilder(
    appRouteInstanceContext.appStructureContext
  )

  // Extract shard resources from current routes
  appRouteInstanceContext.universalRouteInfoNodeList.forEach((routeNode) => {
    pageResourceBuilder.pushShard(routeNode.shardPath)
  })

  const renderResult = await renderPage(
    PathHelper.cwd,
    appRouteInstanceContext.appStructureContext,
    req,
    res,
    params,
    appRouteInstanceContext.rawRouteInfoNodeListRootToLeaf,
    appRouteInstanceContext.universalRouteInfoNodeList,
    pageResourceBuilder
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
