import {
  ErrorHandlerFunction,
  ServerContext,
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
    const errorServerHandler: ErrorHandlerFunction<unknown, unknown> =
      appStructureContext.getModuleByAbsEntryName("/_error.server").errorHandler

    return await errorServerHandler(context, thrownError)
  }

  console.error(
    `Thrown error from _init.server hasn't handled. This error will make unexpected error.`,
    thrownError.error
  )
  return {
    error: {
      msg: "Unexpected server error",
      statusCode: thrownError.statusCode,
      redirect: thrownError.redirect,
    },
  }
}
