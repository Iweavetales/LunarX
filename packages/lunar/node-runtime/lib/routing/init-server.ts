import { AppStructureContext } from "../client-app-structure"
import {
  initServerFunction,
  InitServerFunctionReturn,
  ServerContext,
  ThrownErrorResult,
} from "~/core/server-context"
import { isBoolean } from "lodash"

export async function initServer(
  context: ServerContext,
  appStructureContext: AppStructureContext
): Promise<ThrownErrorResult | true> {
  try {
    /**
     * if Exists _init.server.tsx execute
     */
    if (appStructureContext.hasEntryByAbsEntryName("/_init.server")) {
      const initServerScript: initServerFunction =
        appStructureContext.getModuleByAbsEntryName("/_init.server").default

      /**
       * if _init.server return false will don't ssr and response 404
       */
      const ret: InitServerFunctionReturn = await initServerScript(context)
      if (isBoolean(ret) && ret === false) {
        return {
          error: new Error("init server return `false`"),
          msg: "Forbidden",
          statusCode: 403,
        }
      }

      if (!ret) {
        return ret
      }
    }
  } catch (e) {
    console.error("Failed to server side fetch data from _init.server")
    console.error(e)
    return {
      error: e,
      msg: "Unexpected error",
      statusCode: 500,
    }
  }

  return true
}
