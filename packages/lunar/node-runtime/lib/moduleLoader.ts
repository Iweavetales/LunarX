//입력된 청크 위치로 모듈을 로드

import { join } from "path"

export async function LoadBuiltShardEntryModule(shardPath: string) {
  const modulePath = join(process.cwd(), "/dist/cjs/", shardPath)

  /**
   * Loader use timestamp, randomized numbers to reload renewed module.
   */
  const avoidCacheQuery = `${Date.now()}${Math.random()}`
  const module = await import(modulePath + "?c=" + avoidCacheQuery)

  return module.default
}
