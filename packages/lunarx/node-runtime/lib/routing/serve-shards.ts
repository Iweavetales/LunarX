import { IncomingMessage, ServerResponse } from "http"
import { CutOffQuery, GetUrlPath } from "../url-utils"
import { ProductionMode } from "../constants"
import { writeFileToResponse } from "../write-file-with-response"
import { PathHelper } from "../helper/path"
import { AppStructureContext } from "../client-app-structure"
import { PageParams } from "~/core/server-context"
import { resolve } from "path"

export const serveShards = async (
  req: IncomingMessage,
  res: ServerResponse,
  params: PageParams,
  appContext: AppStructureContext
) => {
  const urlPath = GetUrlPath(req.url!)

  // ⚠️resolve() can protect against Directory Traversal attack
  const normalizedPath = resolve(urlPath)

  const shardPath = CutOffQuery(normalizedPath.replace(/^\/_\/s\//, ""))

  /**
   * Provides .map files in development mode
   */
  if (!ProductionMode) {
    const isMap = /\.map$/.test(shardPath)
    if (isMap) {
      const realShardPath = shardPath.replace(/\.map$/, "")
      const shard = appContext.shards.get(realShardPath)
      if (shard && shard.IsPublicShard) {
        return writeFileToResponse(
          PathHelper.GetDistFilePath(shard.RealPath + ".map"),
          res
        )
      }
    }
  }

  const shard = appContext.shards.get(shardPath)
  if (shard && shard.IsPublicShard) {
    return writeFileToResponse(PathHelper.GetDistFilePath(shard.RealPath), res)
  }

  return res.writeHead(404).end()
}
