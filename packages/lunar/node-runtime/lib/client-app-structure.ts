import { LunarJSManifest } from "~/core/manifest"
import { LoadBuiltShardEntryModule } from "./module-loader"

export type RoutableEntryPointName = string

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

export interface AppStructureContext {
  /**
   라우팅 상관없이 엔트리 포인트로 지정된 모듈 목록
   map[엔트리포인트 값]엔트리청크정보
   */
  // ModuleEntries: { [key: string]: EntryPointInfo };

  // ChunkFileMap: ChunkFileMap;

  Manifest: LunarJSManifest
  LoadedEntryModuleMap: { [shardPath: string]: any }

  shards: Map<string, ShardMeta>

  /**
   * 순서 있는 샤드 배열
   */
  OrderedBrowserScriptShards: string[]
  OrderedBrowserStyleShards: string[]
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
  const webapp: AppStructureContext = {
    Manifest: manifest,
    LoadedEntryModuleMap: {},
    shards: new Map<string, ShardMeta>(),
    OrderedBrowserScriptShards: [],
    OrderedBrowserStyleShards: [],
  }

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
        webapp.OrderedBrowserStyleShards.push(chunk.shardPath)
      } else if (/\.js$/.test(chunk.shardPath)) {
        webapp.OrderedBrowserScriptShards.push(chunk.shardPath)
      }
    }

    webapp.shards.set(shard.ShardPath, shard)
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
        webapp.OrderedBrowserStyleShards.push(entry.shardPath)
      } else if (/\.js$/.test(entry.shardPath)) {
        webapp.OrderedBrowserScriptShards.push(entry.shardPath)
      }
    }

    webapp.shards.set(shard.ShardPath, shard)
  })

  webapp.LoadedEntryModuleMap = loadedModuleMap

  return webapp
}
