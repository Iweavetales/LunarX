//입력된 청크 위치로 모듈을 로드

import { join } from "./deps.ts"

export async function LoadBuiltShardEntryModule(shardPath: string) {
  const modulePath = join(Deno.cwd(), "/dist/esm/", shardPath)

  /**
   * Loader use timestamp, randomized numbers to reload renewed module.
   */
  const avoidCacheQuery = `${Date.now()}${Math.random()}`
  return await import(modulePath + "?c=" + avoidCacheQuery)
}
