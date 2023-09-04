export interface MetaOutput {
  bytes: number
  inputs: {
    [path: string]: {
      bytesInOutput: number
    }
  }
  imports: {
    path: string
    kind: string
  }[]
  exports: string[]
  entryPoint?: string
}
export type ShardSourceType =
  | "stylesheet"
  | "javascript"
  | "mapFile"
  | "unknown"

/**
 * ShardPath is an absolute path that starts from `dist/[client|esm|cjs]/`.
 */
export type ShardPath = string
export type EntryPath = string
export type EntryName = string
/**
 * DedicatedEntryPath
 * Entry path ruled by LunarX
 * * internal: @entry/...
 * * app routes: /...
 */
export type DedicatedEntryPath = string
export type DedicatedEntryName = string

export interface BuiltShardInfo {
  isEntry: boolean
  isChunk: boolean
  isServerSideShard: boolean
  serverSideOutputPath: string // esm output 경로
  clientSideOutputPath: string | undefined // cjs output 경로
  shardPath: ShardPath
  type: ShardSourceType
  fileSize: {
    amd?: number
    cjs?: number
    esm?: number
    any?: number
  } // bytes

  // if ShardType is "Entry" following fields are exists
  entryPoint?: string
  entryFileName?: string
  entryName?: EntryName // entryFile Name without extension
  entryFileRelativeDir?: string
  dedicatedEntryPath?: DedicatedEntryPath
  dedicatedEntryName?: DedicatedEntryName
}

export interface RawRouteInfoNode {
  routePattern: string // /blog/:post 와 같은 라우트 패턴으로 사용 될 수 있는 실제 라우트 패스
  entryPath: string // entries 를 가르ㄹ키는 파일 패스값
  upperRoutePattern: undefined | string // 상위 라우트 노드의 경로를 가르킴
  childrenRoutePatterns?: string[] // 하위 라우트 노드 패턴
  /**
   * @property serverSideEntryPath
   * 이 라우트의 server side running shard 에 해당하며
   * indexPage.server.ts 같은 파일이 지정 된다
   * ex) 라우트 엔트리 indexPage.tsx => indexPage.server.ts
   */
  serverSideEntryPath?: string
}

export interface RawRouteInfoNodeMap {
  [routePattern: string]: RawRouteInfoNode
}

// export type Entry
export interface LunarJSManifest {
  // builtShards: {
  //   [shardPath: string]: BuiltShardInfo;
  // };
  builtVersion: string
  entries: {
    [entryPath: EntryPath]: BuiltShardInfo
  }

  chunks: {
    [outputPath: string]: BuiltShardInfo
  }

  entryDictionaryByDedicatedEntryName: {
    [dedicatedEntryName: DedicatedEntryName]: EntryPath
  }

  routeInfoNodes: RawRouteInfoNodeMap

  /**
   * lib/entry.browser.tsx 엔트리 모듈에 대한 shardPath
   * 세부 정보는 entries 에서 확인 가능
   */
  browserEntryShardPath: string
  customizeAppShardPath?: string // routes/_app.tsx
  customize404ShardPath?: string // routes/_404.tsx
  customizeErrorShardPath?: string // routes/_error.tsx
  customizeServerDocumentShardPath?: string // routes/_document.server.tsx
  initServerShardPath?: string // routes/_init.server.tsx

  browserModuleLoaderFilePath: string
}
