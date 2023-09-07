import {
  ServerContext,
  ServerErrorHandler,
  ThrownErrorResult,
} from "~/core/server-context"
import { AppStructureContext } from "../client-app-structure"
import { PublicServerSideFetchResult } from "~/core/context"

export const rootErrorHandler = async (
  context: ServerContext,
  appStructureContext: AppStructureContext,
  thrownError: ThrownErrorResult
): Promise<PublicServerSideFetchResult<any>> => {
  /**
   * If `_error.server` exists for handling thrownError, it will process or filter the thrown error.
   * If _error.server does not exist, a temporary errorHandleResult will be made public.
   */
  if (appStructureContext.hasEntryByAbsEntryName("/_error.server")) {
    const errorServerHandler: ServerErrorHandler<unknown> =
      appStructureContext.getModuleByAbsEntryName("/_error.server").errorHandler

    return await errorServerHandler(context, thrownError)
  }

  return {
    error: {
      msg: "Unexpected server error",
    },
  }
}
