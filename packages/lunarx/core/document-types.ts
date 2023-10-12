import { ShardPath } from "./manifest"
import { PublicErrorInfo, PublicServerSideFetchResult } from "~/core/context"
import { PageResourceBuilder } from "../node-runtime/lib/helper/page-resource-builder"

export type BrowserRouteNode = {
  path: string
  module: string
  upperPath: string
}

export type MatchPattern = string
/**
 * server 와 browser 둘 다에서 통용되는 RawRouteInfoNode
 */
export interface UniversalRouteInfoNode {
  matchPattern: MatchPattern
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
export type DocumentStyle = { styleId: string; url: string }
export type DocumentStyles = DocumentStyle[]
export type DocumentScript = { scriptId: string; url: string }
export type DocumentScripts = DocumentScript[]
export type DocumentPublicServerFetchesByPatternMap = {
  [routePattern: string]: PublicServerSideFetchResult<any>
}
export type DocumentSheet = {
  pageResourceBuilder: PageResourceBuilder
  advanceScripts: DocumentScripts
  advanceStyles: DocumentStyles
  secondScripts: DocumentScripts
  secondStyles: DocumentStyles
  loaderScriptUrl: string
  browserEntryModulePath: string

  /**
   * Swift Platform 사용자가 커스텀 한 앱과 도큐먼트 컴포넌트
   */
  customAppModuleShardPath: string | null // routes/_app.tsx
  custom404ShardPath: string | null // routes/_404.tsx
  customErrorShardPath: string | null // routes/_error.tsx
  // customAppModuleServerShardPath?: string; // routes/_app.server.ts
  customDocumentModuleShardPath: string | null // routes/_document.server.tsx

  // 최상위 라우트에서 최종 매치된 라우트까지 거쳐진 모든 라우트 배열
  // routeStem: BrowserRouteNode[]
  routeServerFetchesResultMap: DocumentPublicServerFetchesByPatternMap
  err: PublicErrorInfo<any> | null
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
  v: string // built version
}
