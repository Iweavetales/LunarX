//입력된 청크 위치로 모듈을 로드

import { join } from "path"
import { PathHelper } from "./helper/path"
import { ShardPath } from "~/core/manifest"

export function ShardPathToRealModulePath(shardPath: ShardPath): string {
  return join(PathHelper.cwd, "/dist/cjs/", shardPath)
}

export async function LoadBuiltShardEntryModule(shardPath: string) {
  const modulePath = ShardPathToRealModulePath(shardPath)

  /**
   * Loader use timestamp, randomized numbers to reload renewed module.
   */
  const avoidCacheQuery = `${Date.now()}${Math.random()}`
  const module = await import(modulePath + "?c=" + avoidCacheQuery)

  return module.default
}
