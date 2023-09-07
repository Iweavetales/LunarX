import {
  ServerContext,
  ServerSideFetchesReturnMap,
} from "~/core/server-context"
import { AppStructureContext } from "../client-app-structure"
import { DocumentPublicServerFetchesByPatternMap } from "~/core/document-types"
import { rootErrorHandler } from "./root-error-handler"

export const preProcessPipelineErrorHandleOfFetches = async (
  context: ServerContext,
  appStructureContext: AppStructureContext,
  fetchesMap: ServerSideFetchesReturnMap
): Promise<DocumentPublicServerFetchesByPatternMap> => {
  const documentPublicServerFetchesByPatternMap: DocumentPublicServerFetchesByPatternMap =
    {}
  const fetchedPatternKeys = Object.keys(fetchesMap)
  for (const fetchKey of fetchedPatternKeys) {
    const fetchesResult = fetchesMap[fetchKey]
    if (fetchesResult && fetchesResult.throwError) {
      const handler = appStructureContext.getErrorHandlerAtRoute(fetchKey)
      if (handler) {
        documentPublicServerFetchesByPatternMap[fetchKey] = await handler(
          context,
          fetchesResult.throwError
        )
      } else {
        // if doesn't exists route error handler, Use root error handler
        documentPublicServerFetchesByPatternMap[fetchKey] =
          await rootErrorHandler(
            context,
            appStructureContext,
            fetchesResult.throwError
          )
      }
    } else {
      documentPublicServerFetchesByPatternMap[fetchKey] = fetchesMap[fetchKey]
    }
  }

  return documentPublicServerFetchesByPatternMap
}
