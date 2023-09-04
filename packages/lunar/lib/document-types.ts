import { ShardPath } from "./manifest"

export type BrowserRouteNode = {
  path: string
  module: string
  upperPath: string
}

/**
 * server 와 browser 둘 다에서 통용되는 RawRouteInfoNode
 */
export interface UniversalRouteInfoNode {
  matchPattern: string
  childNodes?: UniversalRouteInfoNode[]
  upperRouteMatchPattern?: string
  shardPath: string
}
export type RouteServerFetchDataMap = {
  [routePattern: string]: any
}

/**
 * 최상위 라우트 노드 목록
 */
export type TopLevelUniversalRouteInfoNodes = UniversalRouteInfoNode[]

export type DocumentSheet = {
  scripts: { scriptId: string; url: string }[]
  styles: { styleId: string; url: string }[]
  loaderScriptUrl: string
  browserEntryModulePath: string

  /**
   * Swift Platform 사용자가 커스텀 한 앱과 도큐먼트 컴포넌트
   */
  customAppModuleShardPath?: string // routes/_app.tsx
  custom404ShardPath?: string // routes/_404.tsx
  customErrorShardPath?: string // routes/_error.tsx
  // customAppModuleServerShardPath?: string; // routes/_app.server.ts
  customDocumentModuleShardPath?: string // routes/_document.server.tsx

  // 최상위 라우트에서 최종 매치된 라우트까지 거쳐진 모든 라우트 배열
  routeStem: BrowserRouteNode[]
  routeServerFetchesResultMap: {
    [routePattern: string]: any
  }

  /**
   * 오름차순 라우트 노드 리스트
   * 주의: 트리 형식이 아닌 최종 매치 라우트 까지의 계층이 오름차순으로 나열 된 리스트이다
   */
  /**
   * Universal [R]oute [I]nfo [N]ode List
   */
  universalRINListRootToLeaf: UniversalRouteInfoNode[]
  // ascendRouteNodeList: UniversalRouteInfoNode[]
  requireFunction: (shardPath: ShardPath) => any

  nonce: string // script 에 사용되는 nonce 값
}
