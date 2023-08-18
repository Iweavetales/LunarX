export type MetaOutput = {
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
export type ShardType = "stylesheet" | "javascript" | "mapFile" | "unknown"

export type BuiltShardInfo = {
  isEntry: boolean
  isChunk: boolean
  isServerSideShard: boolean
  serverSideOutputPath: string // esm output 경로
  clientSideOutputPath: string | undefined // cjs output 경로
  shardPath: string
  type: ShardType

  // Entry 샤드 일 경우 아래 속성 존재
  entryPoint?: string
  entryFileName?: string
  entryFileRelativeDir?: string
}

export type RouteNodeMap = {
  [routePattern: string]: RouteNode
}
export type RouteNode = {
  routePattern: string // /blog/:post 와 같은 라우트 패턴으로 사용 될 수 있는 실제 라우트 패스
  entryPath: undefined | string // entries 를 가르ㄹ키는 파일 패스값
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
// export type Entry
export type LunarJSManifest = {
  // builtShards: {
  //   [shardPath: string]: BuiltShardInfo;
  // };
  builtVersion: string
  entries: {
    [entryPath: string]: BuiltShardInfo
  }
  chunks: {
    [outputPath: string]: BuiltShardInfo
  }

  routeNodes: RouteNodeMap

  /**
   * lib/entry.browser.tsx 엔트리 모듈에 대한 shardPath
   * 세부 정보는 entries 에서 확인 가능
   */
  browserEntryShardPath: string
  customizeAppShardPath?: string // routes/_app.tsx
  customizeServerDocumentShardPath?: string // routes/_document.server.tsx
  initServerShardPath?: string // routes/_init.server.tsx

  browserModuleLoaderFilePath: string
}
