import {
  DocumentPublicServerFetchesByPatternMap,
  UniversalRouteInfoNode,
} from "~/core/document-types"
import ServerContext from "~/core/server-context"
import { EntryServerHandler } from "~/core/types.server"
import { AppStructureContext } from "../client-app-structure"
import { PublicServerSideFetchResult } from "~/core/context"
import { ServerResponse } from "http"
import { PageResourceBuilder } from "../helper/page-resource-builder"

export async function executeServerEntry(
  entryServerHandler: EntryServerHandler,
  res: ServerResponse,
  // if init.server has an error This parameter is set
  initErrorHandleResult: PublicServerSideFetchResult<any> | null,
  context: ServerContext,
  appStructureContext: AppStructureContext,
  publicServerFetchesResultMap: DocumentPublicServerFetchesByPatternMap,
  universalRouteInfoNodeList: UniversalRouteInfoNode[],

  pageResourceBuilder: PageResourceBuilder,
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

  pageResourceBuilder
    .pushShard(customServerDocumentShardPath, true)
    .pushShard(customAppShardPath)
    .pushShard(custom404PageShardPath)
    .pushShard(customErrorPageShardPath)
    .pushShard(appStructureContext.manifest.browserEntryShardPath)

  return await entryServerHandler(
    context,
    {
      pageResourceBuilder: pageResourceBuilder,
      advanceScripts: new Array(
        ...pageResourceBuilder.dependingScripts.values()
      ).map((shardPath: string) => {
        return {
          scriptId: "",
          url: appStructureContext.shardPathToPublicUrlPath(shardPath),
        }
      }),
      advanceStyles: new Array(
        ...pageResourceBuilder.dependingStyles.values()
      ).map((shardPath: string) => {
        return {
          styleId: "",
          url: appStructureContext.shardPathToPublicUrlPath(shardPath),
        }
      }),
      secondScripts: appStructureContext.orderedBrowserScriptShards
        .filter(
          (shardPath: string) =>
            !pageResourceBuilder.dependingScripts.has(shardPath)
        )
        .map((shardPath: string) => {
          return {
            scriptId: "",
            url: appStructureContext.shardPathToPublicUrlPath(shardPath),
          }
        }),
      secondStyles: appStructureContext.orderedBrowserStyleShards
        .filter(
          (shardPath: string) =>
            !pageResourceBuilder.dependingStyles.has(shardPath)
        )
        .map((shardPath: string) => {
          return {
            styleId: "",
            url: appStructureContext.shardPathToPublicUrlPath(shardPath),
          }
        }),
      loaderScriptUrl:
        "/_/s/loader.js?v=" + appStructureContext.manifest.builtVersion,
      browserEntryModulePath:
        appStructureContext.manifest.browserEntryShardPath,

      customAppModuleShardPath: customAppShardPath,
      custom404ShardPath: custom404PageShardPath,
      customErrorShardPath: customErrorPageShardPath,
      customDocumentModuleShardPath: customServerDocumentShardPath,

      // server side fetched 데이터 맵
      routeServerFetchesResultMap: publicServerFetchesResultMap,
      err: initErrorHandleResult?.error ?? null,

      // 오름차순 정렬 라우트 노드 정보
      universalRINListRootToLeaf: universalRouteInfoNodeList,
      // initError
      // 모듈 로드 함수
      requireFunction: (shardPath: string): any => {
        return appStructureContext.getModuleByShardPath(shardPath)
      },
      nonce: nonce,
      v: appStructureContext.manifest.builtVersion,
    },
    res
  )
}
