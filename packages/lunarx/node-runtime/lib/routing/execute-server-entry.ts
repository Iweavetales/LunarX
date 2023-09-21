import {
  DocumentPublicServerFetchesByPatternMap,
  DocumentSheet,
  UniversalRouteInfoNode,
} from "~/core/document-types"
import ServerContext from "~/core/server-context"
import { EntryServerHandler } from "~/core/types.server"
import { AppStructureContext } from "../client-app-structure"
import { PublicServerSideFetchResult } from "~/core/context"
import { ServerResponse } from "http"

export async function executeServerEntry(
  entryServerHandler: EntryServerHandler,
  res: ServerResponse,
  // if init.server has an error This parameter is set
  initErrorHandleResult: PublicServerSideFetchResult<any> | null,
  context: ServerContext,
  appStructureContext: AppStructureContext,
  publicServerFetchesResultMap: DocumentPublicServerFetchesByPatternMap,
  universalRouteInfoNodeList: UniversalRouteInfoNode[],
  nonce: string
) {
  const customAppShardPath =
    appStructureContext.getShardPathByAbsEntryName("/_app")
  const customErrorPageShardPath =
    appStructureContext.getShardPathByAbsEntryName("/_error")
  const custom404PageShardPath =
    appStructureContext.getShardPathByAbsEntryName("/_404")
  const customServerDocumentShardPath =
    appStructureContext.getShardPathByAbsEntryName("/_document.server")

  return await entryServerHandler(
    context,
    {
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
      browserEntryModulePath:
        appStructureContext.manifest.browserEntryShardPath,
      customAppModuleShardPath: customAppShardPath,
      custom404ShardPath: custom404PageShardPath,
      customErrorShardPath: customErrorPageShardPath,
      customDocumentModuleShardPath: customServerDocumentShardPath,

      err: initErrorHandleResult?.error ?? null,
      // server side fetched 데이터 맵
      routeServerFetchesResultMap: publicServerFetchesResultMap,
      // 오름차순 정렬 라우트 노드 정보
      universalRINListRootToLeaf: universalRouteInfoNodeList,
      // 모듈 로드 함수
      requireFunction: (shardPath: string): any => {
        return appStructureContext.getModuleByShardPath(shardPath)
      },
    } as DocumentSheet,
    res
  )
}
