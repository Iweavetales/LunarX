import { IncomingMessage, ServerResponse } from "http"
import { writeFileToResponse } from "../write-file-with-response"
import { PathHelper } from "../helper/path"
import { AppStructureContext } from "../client-app-structure"
import { PageParams } from "~/core/lunar-context"

export const serveLoader = async (
  req: IncomingMessage,
  res: ServerResponse,
  params: PageParams,
  context: AppStructureContext
) => {
  if (context.manifest.browserModuleLoaderFilePath) {
    return writeFileToResponse(
      PathHelper.GetDistFilePath(context.manifest.browserModuleLoaderFilePath),
      res
    )
  }
  return res.writeHead(404).end()
}
