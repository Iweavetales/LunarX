import { IncomingMessage, ServerResponse } from "http"
import { PageParams } from "~/core/lunar-context"
import { AppRouteInstanceContext } from "./app-route-instance-context"
import { GetUrlPath } from "../url-utils"
import { rawHeaderStringArrayToMutableHTTPHeaders } from "../http-header"
import { MutableHTTPHeaders } from "~/core/http-headers.server"
import { makeServerContext } from "../make-server-context"
import {
  FetchingServerSideRouteData,
  ServerSideFetchResult,
  ServerSideRouteFetchResult,
} from "../fetch-server-side-route-data"

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
    requestHeaders,
    responseHeaders
  )

  /**
   * _init.server.tsx 파일이 존재 한다면 먼저 처리 한다.
   */
  if (
    appRouteInstanceContext.appStructureContext.hasEntryByAbsEntryName(
      "/_init.server"
    )
  ) {
    const initServerScript: any =
      appRouteInstanceContext.appStructureContext.getModuleByAbsEntryName(
        "/_init.server"
      ).default

    const ret: boolean = await initServerScript(context)
    //@Todo change response method
    if (!ret) {
      return res.writeHead(404, {}).end("error")
    }
  }

  const fetchedDataList: ServerSideFetchResult[] = []
  await Promise.all(
    appRouteInstanceContext.rawRouteInfoNodeListRootToLeaf.map((routeNode) => {
      return new Promise((resolve, reject) => {
        ;(async function () {
          const result = await FetchingServerSideRouteData(
            routeNode,
            appRouteInstanceContext.appStructureContext,
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

  if (
    appRouteInstanceContext.appStructureContext.hasEntryByAbsEntryName(
      "/_app.server"
    )
  ) {
    const appServerSideModule: any =
      appRouteInstanceContext.appStructureContext.getModuleByAbsEntryName(
        "/_app.server"
      )
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
      r: appRouteInstanceContext.universalRouteInfoNodeList,
    })
  )
}
