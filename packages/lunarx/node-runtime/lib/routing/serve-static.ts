import { IncomingMessage, ServerResponse } from "http"
import { GetUrlPath } from "../url-utils"
import { join, resolve } from "path"
import { PathHelper } from "../helper/path"
import { writeFileToResponse } from "../write-file-with-response"
import { PageParams } from "~/core/server-context"
import { AppStructureContext } from "../client-app-structure"

export const serveStatic = async (
  req: IncomingMessage,
  res: ServerResponse,
  params: PageParams,
  context: AppStructureContext
) => {
  const urlPath = GetUrlPath(req.url!)

  // ⚠️resolve() can protect against Directory Traversal attack
  const resolvedPath = resolve(urlPath.replace(/^\/static/, ""))

  const filePath = join(PathHelper.cwd, "/static/", resolvedPath)

  return writeFileToResponse(filePath, res)
}
