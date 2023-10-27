import { IncomingMessage, ServerResponse } from "http"
import { PageParams } from "~/core/server-context"
import { AppRouteInstanceContext } from "./app-route-instance-context"
import { MutableHTTPHeaders } from "~/core/http-headers.server"
import { PageResourceBuilder } from "../helper/page-resource-builder"

export const preloadRouteInfo = async (
  req: IncomingMessage,
  res: ServerResponse,
  params: PageParams,
  appRouteInstanceContext: AppRouteInstanceContext
) => {
  const responseHeaders = new MutableHTTPHeaders()
  responseHeaders.append("content-type", "application/json")

  const pageResourceBuilder = new PageResourceBuilder(
    appRouteInstanceContext.appStructureContext
  )
  // Extract shard resources from current routes
  appRouteInstanceContext.universalRouteInfoNodeList.forEach((routeNode) => {
    pageResourceBuilder.pushShard(routeNode.shardPath)
  })

  return res.writeHead(200, responseHeaders.asObject()).end(
    JSON.stringify({
      r: appRouteInstanceContext.universalRouteInfoNodeList,
      a: [...pageResourceBuilder.dependingScripts.values()],
      d: [...pageResourceBuilder.dependingStyles.values()],
    })
  )
}
