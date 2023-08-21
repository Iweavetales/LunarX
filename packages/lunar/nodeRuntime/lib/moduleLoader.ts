//입력된 청크 위치로 모듈을 로드

import { join } from "path"

export async function LoadBuiltShardEntryModule(shardPath: string) {
  const modulePath = join(process.cwd(), "/dist/cjs/", shardPath)

  /**
   * 모듈이 다시 로드 될 때 새로운 모듈을 로드 하기 위해서 타임스탬프와 난수를 사용해 새로운 리소스를 불러 오도록 한다
   */
  const avoidCacheQuery = `${Date.now()}${Math.random()}`
  const module = await import(modulePath + "?c=" + avoidCacheQuery)

  return module.default
}
