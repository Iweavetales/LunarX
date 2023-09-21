import { AbstractEntryName, LunarJSManifest, ShardPath } from "~/core/manifest"
import { LoadBuiltShardEntryModule } from "./module-loader"
import { ServerErrorHandler } from "~/core/server-context"

export enum ShardType {
  Chunk,
  Entry,
}

export enum ShardSourceType {
  Javascript,
  Stylesheet,
  MapFile,
  Unknown,
}

export type ShardMeta = {
  ShardPath: string
  ShardType: ShardType
  shardSourceType: ShardSourceType
  RealPath: string
  IsPublicShard: boolean
}

export class AppStructureContext {
  #manifest: LunarJSManifest
  #loadedEntryModuleMap: { [shardPath: string]: any }

  #shards: Map<string, ShardMeta>

  /**
   * 순서 있는 샤드 배열
   */
  #orderedBrowserScriptShards: string[]
  #orderedBrowserStyleShards: string[]

  constructor(
    manifest: LunarJSManifest,
    loadedEntryModuleMap: { [shardPath: string]: any },
    shards: Map<string, ShardMeta>,
    orderedBrowserScriptShards: string[],
    orderedBrowserStyleShards: string[]
  ) {
    this.#manifest = manifest
    this.#loadedEntryModuleMap = loadedEntryModuleMap
    this.#shards = shards
    this.#orderedBrowserScriptShards = orderedBrowserScriptShards
    this.#orderedBrowserStyleShards = orderedBrowserStyleShards
  }

  get manifest(): LunarJSManifest {
    return this.#manifest
  }
  get loadedEntryModuleMap(): { [shardPath: string]: any } {
    return this.#loadedEntryModuleMap
  }
  get shards(): Map<string, ShardMeta> {
    return this.#shards
  }
  get orderedBrowserScriptShards(): string[] {
    return this.#orderedBrowserScriptShards
  }
  get orderedBrowserStyleShards(): string[] {
    return this.#orderedBrowserStyleShards
  }

  hasEntryByAbsEntryName(name: AbstractEntryName): boolean {
    return Boolean(this.#manifest.entryDictionaryByAbstractEntryName[name])
  }

  getShardPathByAbsEntryName(name: AbstractEntryName): ShardPath | null {
    const realEntryPath =
      this.#manifest.entryDictionaryByAbstractEntryName[name]

    const entry = this.#manifest.entries[realEntryPath]
    if (entry) {
      return entry.shardPath
    }

    return null
  }

  getModuleByAbsEntryName(name: AbstractEntryName): any {
    const shardPath = this.getShardPathByAbsEntryName(name)

    if (!shardPath) {
      throw new Error(`Not found shard for ${name}`)
    }

    return this.getModuleByShardPath(shardPath)
  }

  getModuleByShardPath(shardPath: AbstractEntryName): any {
    return this.#loadedEntryModuleMap[shardPath]
  }

  shardPathToPublicUrlPath(shardPath: string, version = true): string {
    if (version) {
      return "/_/s/" + shardPath + "?v=" + version
    }
    return "/_/s/" + shardPath
  }

  getErrorHandlerAtRoute(routePattern: string): ServerErrorHandler<any> | null {
    //
    const patternTokens = routePattern.split("/")
    const lastToken = patternTokens.pop()
    if (lastToken) {
      const errorHandlerAbsEntryName = `${patternTokens.join(
        "/"
      )}/_${lastToken}.error.server`
      const entryPath =
        this.#manifest.entryDictionaryByAbstractEntryName[
          errorHandlerAbsEntryName
        ]

      if (!entryPath) {
        return null
      }

      const entry = this.#manifest.entries[entryPath]
      if (!entry) {
        console.warn(
          `Error handler entry[${entryPath}] for route[${routePattern}] was not found.`
        )
        return null
      }

      const module = this.#loadedEntryModuleMap[entry.shardPath]

      if (module) {
        return module.errorHandler as ServerErrorHandler<any>
      }
    }

    return null
  }
}

// app/lib/head.tsx
// CollectEntries /**
// HTTP 라우팅이 가능한 엔트리 목록을 추출
// relativeRoutesRoot : App Root 베이스의 routesRoot 상대경로
// ex) relativeRoutesRoot == "./app/routes"
export async function MakeAppStructureContextFromManifest(
  manifest: LunarJSManifest
): Promise<AppStructureContext> {
  const shards = new Map<string, ShardMeta>()
  const orderedBrowserScriptShards: string[] = []
  const orderedBrowserStyleShards: string[] = []

  const entryKeys = Object.keys(manifest.entries)

  /**
   * 모든 Entry 에 해당하는 모듈을 로드
   */
  const loadedModules = await Promise.all(
    entryKeys.map(async (key, idx) => {
      const entry = manifest.entries[key]

      return {
        key: entry.shardPath,
        module: await LoadBuiltShardEntryModule(entry.shardPath),
      }
    })
  )

  const loadedModuleMap = loadedModules.reduce((acc, cur) => {
    return {
      ...acc,
      [cur.key]: cur.module,
    }
  }, {})

  Object.keys(manifest.chunks).forEach((chunkKey) => {
    const chunk = manifest.chunks[chunkKey]
    const shard: ShardMeta = {
      ShardPath: chunk.shardPath,
      RealPath: chunk.clientSideOutputPath ?? "??",
      ShardType: ShardType.Chunk,
      shardSourceType: ShardSourceType.Unknown,
      IsPublicShard: false,
    }

    if (chunk.isServerSideShard) {
      shard.IsPublicShard = false
    } else {
      shard.IsPublicShard = true

      if (/\.css$/.test(chunk.shardPath)) {
        orderedBrowserStyleShards.push(chunk.shardPath)
      } else if (/\.js$/.test(chunk.shardPath)) {
        orderedBrowserScriptShards.push(chunk.shardPath)
      }
    }

    shards.set(shard.ShardPath, shard)
  })

  Object.keys(manifest.entries).forEach((entryKey) => {
    const entry = manifest.entries[entryKey]
    const shard: ShardMeta = {
      ShardPath: entry.shardPath,
      RealPath: entry.clientSideOutputPath ?? "??",
      ShardType: ShardType.Entry,
      shardSourceType: ShardSourceType.Unknown,
      IsPublicShard: false,
    }

    if (entry.isServerSideShard) {
      shard.IsPublicShard = false
    } else {
      shard.IsPublicShard = true

      if (/\.css$/.test(entry.shardPath)) {
        orderedBrowserStyleShards.push(entry.shardPath)
      } else if (/\.js$/.test(entry.shardPath)) {
        orderedBrowserScriptShards.push(entry.shardPath)
      }
    }

    shards.set(shard.ShardPath, shard)
  })

  return new AppStructureContext(
    manifest,
    loadedModuleMap,
    shards,
    orderedBrowserScriptShards,
    orderedBrowserStyleShards
  )
}
