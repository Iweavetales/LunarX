import {
  ServerContext,
  ServerFetches,
  ServerSideFetchesReturnMap,
  ServerSideFetchReturn,
} from "~/core/server-context"
import { processServerFetchesForRouteNode } from "../fetch-server-side-route-data"
import { AppStructureContext } from "../client-app-structure"
import { RawRouteInfoNode } from "~/core/manifest"

export async function preProcessPipelineForSsr(
  context: ServerContext,
  appStructureContext: AppStructureContext,
  rawRouteInfoNodeListRootToLeaf: RawRouteInfoNode[]
): Promise<ServerSideFetchesReturnMap> {
  const routeServerFetchesResultMap: ServerSideFetchesReturnMap = {}

  /**
   * 라우트 노드별 serverFetches 를 실행 하여  데이터를 각각 로딩
   * execute serial
   */
  for (const routeNode of rawRouteInfoNodeListRootToLeaf) {
    const result: ServerSideFetchReturn<any> = await new Promise((resolve) => {
      ;(async function () {
        try {
          const result = await processServerFetchesForRouteNode(
            routeNode,
            appStructureContext,
            context
          )

          resolve(result)
        } catch (e) {
          resolve({
            throwError: {
              error: e,
              msg: "Unexpected error",
            },
          })
        }
      })()
    })

    routeServerFetchesResultMap[routeNode.routePattern] = result
    /**
     * If serverSideFetch throw an error don't process serverFetches for child route
     */
    if (result?.throwError) {
      console.error("fetch error", routeNode.routePattern, result?.throwError)
      break
    }
  }

  /**
   * _app.server.tsx 파일이 있다면 해당 파일에 대한 처리
   */
  try {
    if (appStructureContext.hasEntryByAbsEntryName("/_app.server")) {
      const appServerSideModule: any =
        appStructureContext.getModuleByAbsEntryName("/_app.server")

      const appServerFetchFunction: ServerFetches<any> =
        appServerSideModule.serverFetches

      const appServerSideFetchResult = await appServerFetchFunction(context)
      routeServerFetchesResultMap["_app"] = appServerSideFetchResult
    }
  } catch (e) {
    console.error("Failed to server side fetch _app.server data", e)
  }

  return routeServerFetchesResultMap
}
