import { AbstractEntryName, LunarJSManifest } from "~/core/manifest"
import { LoadBuiltShardEntryModule } from "./module-loader"

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

  getModuleByAbsEntryName(name: AbstractEntryName): any {
    const realEntryPath =
      this.#manifest.entryDictionaryByAbstractEntryName[name]

    if (!realEntryPath) {
      throw new Error(`Not found entry for ${name}`)
    }

    return this.#loadedEntryModuleMap[
      this.#manifest.entries[realEntryPath].shardPath
    ]
  }
}

// class WebApp implements AppStructureContext {}

const LibEntryFinder = {
  react: /^node_modules\/react\/index\.js/,
  reactDom: /^node_modules\/react-dom\/index\.js/,
  reactDomServer: /^node_modules\/react-dom\/server/,
  reactRouterDomServer: /^node_modules\/react-router-dom\/server/,

  LunarJSPlatformEntryServer: /^app\/lib\/entry.server\.tsx/,
  LunarJSPlatformHead: /^app\/lib\/head\.tsx/,
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
