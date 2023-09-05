import { DocumentSheet, UniversalRouteInfoNode } from "~/core/document-types"
import ServerContext from "~/core/lunar-context"
import { EntryServerHandler } from "~/core/types.server"
import { AppStructureContext } from "../client-app-structure"
import { ServerSideRouteFetchResult } from "../fetch-server-side-route-data"

export async function executeServerEntry(
  entryServerHandler: EntryServerHandler,
  context: ServerContext,
  appStructureContext: AppStructureContext,
  serverFetchesResultMap: {
    [pattern: string]: ServerSideRouteFetchResult | undefined
  },
  universalRouteInfoNodeList: UniversalRouteInfoNode[],
  nonce: string
) {
  return await entryServerHandler(context, {
    scripts: appStructureContext.orderedBrowserScriptShards.map(
      (shardPath: string) => {
        return {
          url: appStructureContext.shardPathToPublicUrlPath(shardPath),
        }
      }
    ),
    styles: appStructureContext.orderedBrowserStyleShards.map(
      (shardPath: string) => {
        return {
          url: appStructureContext.shardPathToPublicUrlPath(shardPath),
        }
      }
    ),
    nonce: nonce,
    loaderScriptUrl:
      "/_/s/loader.js?v=" + appStructureContext.manifest.builtVersion,
    browserEntryModulePath: appStructureContext.manifest.browserEntryShardPath,
    customAppModuleShardPath:
      appStructureContext.manifest.customizeAppShardPath,
    custom404ShardPath: appStructureContext.manifest.customize404ShardPath,
    customErrorShardPath: appStructureContext.manifest.customizeErrorShardPath,
    customDocumentModuleShardPath:
      appStructureContext.manifest.customizeServerDocumentShardPath,

    // server side fetched 데이터 맵
    routeServerFetchesResultMap: serverFetchesResultMap,
    // 오름차순 정렬 라우트 노드 정보
    universalRINListRootToLeaf: universalRouteInfoNodeList,
    // 모듈 로드 함수
    requireFunction: (shardPath: string): any => {
      return appStructureContext.getModuleByShardPath(shardPath).default
    },
  } as DocumentSheet)
}
