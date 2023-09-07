import {
  ServerContext,
  ServerSideFetchesReturnMap,
} from "~/core/server-context"
import { AppStructureContext } from "../client-app-structure"
import { RawRouteInfoNode } from "~/core/manifest"
import { DocumentPublicServerFetchesByPatternMap } from "~/core/document-types"

export const preProcessPipelineErrorHandleOfFetches = async (
  context: ServerContext,
  appStructureContext: AppStructureContext,
  rawRouteInfoNodeListRootToLeaf: RawRouteInfoNode[],
  fetchesMap: ServerSideFetchesReturnMap
): Promise<DocumentPublicServerFetchesByPatternMap> => {
  const fetchedPatternKeys = Object.keys(fetchesMap)
  for (const fetchKey of fetchedPatternKeys) {
    console.log("fetchKey", fetchKey)
  }

  return {}
}
