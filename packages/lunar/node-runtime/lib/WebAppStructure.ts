import { OutputChunkInfo } from "./Meta"

import { BuiltShardInfo, LunarJSManifest } from "../../lib/manifest"
import { LoadBuiltShardEntryModule } from "./moduleLoader"

export type RoutableEntryPointName = string

export type ShardType = "chunk" | "entry"
export type ShardMeta = {
  ShardPath: string
  ShardType: ShardType
  RealPath: string
}

export interface WebAppStructure {
  /**
   라우팅 상관없이 엔트리 포인트로 지정된 모듈 목록
   map[엔트리포인트 값]엔트리청크정보
   */
  // ModuleEntries: { [key: string]: EntryPointInfo };

  // ChunkFileMap: ChunkFileMap;

  Manifest: LunarJSManifest
  LoadedEntryModuleMap: { [shardPath: string]: any }

  /**
   * 클라이언트에 전달될 소스 파일 맵
   */
  BrowserShards: {
    // source 의 파일명과 해당 소스파일에 해당하는 경로
    [ShardPath: string]: ShardMeta
  }

  /**
   * 순서 있는 샤드 배열
   */
  OrderedBrowserScriptShards: string[]
  OrderedBrowserStyleShards: string[]
}

// class WebApp implements WebAppStructure {}

const LibEntryFinder = {
  react: /^node_modules\/react\/index\.js/,
  reactDom: /^node_modules\/react-dom\/index\.js/,
  reactDomServer: /^node_modules\/react-dom\/server/,
  reactRouterDomServer: /^node_modules\/react-router-dom\/server/,

  LunarJSPlatformEntryServer: /^app\/lib\/entry.server\.tsx/,
  LunarJSPlatformHead: /^app\/lib\/head\.tsx/,
}

/**
 * Check this SourceFile can be exposed client
 * 클라이언트에서 동작 할 소스코드가
 * WebAppStructure.ClientSourceFileMap 에 등록 될 때
 * 해당 소스파일이 클라이언트에 노출 되어도 괜찮은지를 체크 하는 함수
 * ex) app/lib/entry.server.tsx 파일은 서버사이드 랜더링에만 사용 되고,
 *     감춰진 API 를 호출 할 수도 있기 때문에 클라이언트에 노출 되어선 안된다.
 *
 * 됐고  서버사이드 스크립트 필터임
 * @param outputFileName
 * @param chunkInfo
 * @constructor
 */
function CheckThisSourceFileCanBeExposedClient(
  outputFileName: string,
  chunkInfo: OutputChunkInfo
) {
  // let originFilename= chunkInfo.Server
  console.log("check source", outputFileName, chunkInfo)
}
// app/lib/head.tsx
// CollectEntries /**
// HTTP 라우팅이 가능한 엔트리 목록을 추출
// relativeRoutesRoot : App Root 베이스의 routesRoot 상대경로
// ex) relativeRoutesRoot == "./app/routes"
export async function ResolveWebappStructure(
  manifest: LunarJSManifest
): Promise<WebAppStructure> {
  const webapp: WebAppStructure = {
    Manifest: manifest,
    LoadedEntryModuleMap: {},
    BrowserShards: {},
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

  {
    const entryKeys = Object.keys(manifest.entries)
    const chunkKeys = Object.keys(manifest.chunks)

    chunkKeys.forEach((chunkKey) => {
      const chunk = manifest.chunks[chunkKey]
      if (chunk.isServerSideShard) {
        return
      }

      webapp.BrowserShards[chunk.shardPath] = {
        ShardPath: chunk.shardPath,
        RealPath: chunk.clientSideOutputPath ?? "??",
        ShardType: "entry",
      }

      if (/\.css$/.test(chunk.shardPath)) {
        webapp.OrderedBrowserStyleShards.push(chunk.shardPath)
      } else if (/\.js$/.test(chunk.shardPath)) {
        webapp.OrderedBrowserScriptShards.push(chunk.shardPath)
      }
    })

    entryKeys.forEach((entryKey) => {
      const entry = manifest.entries[entryKey]
      if (entry.isServerSideShard) {
        return
      }

      webapp.BrowserShards[entry.shardPath] = {
        ShardPath: entry.shardPath,
        RealPath: entry.clientSideOutputPath ?? "??",
        ShardType: "entry",
      }

      if (/\.css$/.test(entry.shardPath)) {
        webapp.OrderedBrowserStyleShards.push(entry.shardPath)
      } else if (/\.js$/.test(entry.shardPath)) {
        webapp.OrderedBrowserScriptShards.push(entry.shardPath)
      }
    })
  }

  webapp.LoadedEntryModuleMap = loadedModuleMap

  return webapp
}
