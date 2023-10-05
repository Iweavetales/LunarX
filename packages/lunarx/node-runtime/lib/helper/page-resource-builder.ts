import { AppStructureContext } from "../client-app-structure"

export class PageResourceBuilder {
  dependingScripts: Set<string> = new Set<string>()
  dependingStyles: Set<string> = new Set<string>()
  #appStructureContext: AppStructureContext

  constructor(appStructureContext: AppStructureContext) {
    this.#appStructureContext = appStructureContext
  }

  pushShard(
    shardPath: string | null,
    extractStyleOnly = false
  ): PageResourceBuilder {
    if (!shardPath) return this
    const shardInfo =
      this.#appStructureContext.getShardInfoByShardPath(shardPath)

    if (extractStyleOnly === false) {
      if (shardInfo?.requiredShardPaths) {
        shardInfo?.requiredShardPaths.forEach((shardPath) =>
          this.dependingScripts.add(shardPath)
        )
      }
      this.dependingScripts.add(shardInfo!.shardPath!)
    }

    if (shardInfo?.cssBundle) {
      const cssBundleShardInfo =
        this.#appStructureContext.getShardInfoByOutputPath(shardInfo.cssBundle)

      if (cssBundleShardInfo) {
        this.dependingStyles.add(cssBundleShardInfo.shardPath)
      }
    }

    return this
  }
}
