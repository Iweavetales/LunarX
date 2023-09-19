import React, { createContext, useContext } from "react"
import { ShardLoader } from "../router"
import {
  RouteServerFetchDataMap,
  UniversalRouteInfoNode,
} from "~/core/document-types"

export type RootAppContextValue = {
  loader: ShardLoader
  routeShardPrepareTrigger: (shardPaths: string[]) => Promise<void>
  components: { [shardPath: string]: React.FunctionComponent }
  registerComponentByShardPath: (shardPath: string, shard: any) => void
  errorComponent: React.FunctionComponent
  notFoundComponent: React.FunctionComponent

  enterLocation: {
    pathname: string
    search: string
    hash: string
  }
  ascendRouteNodeList: UniversalRouteInfoNode[]
  dataMatchMap: RouteServerFetchDataMap

  staticHandler?: { dataRoutes: any; context: any }
  //
  // // client side browsing 에 긴밀하게 사용되는 속성들
  // fetchingRoute: boolean; // 현재 라우트 정보와 라우트 데이터를 가져오고 있는 중일때 true 로 세팅됨
  // latestFetchRoutePattern: string; // 가장 최근 패치를 한 라우트 패턴
}
/**
 * SwiftApp 플랫폼 내부적으로 사용되는 슈퍼 컨텍스트
 * SwiftApp 컴포넌트의 루트 컨텍스트로 사용 되며
 * SwiftRouter 등에게 데이터를 전달 한다.
 */
export const RootAppContext = createContext<RootAppContextValue>({
  loader: async (shardPath: string) => {
    return true
  },
  routeShardPrepareTrigger: async (shardPaths: string[]) => {
    return
  },
  components: {},
  registerComponentByShardPath: () => {
    return
  },
  errorComponent: () => <div></div>,
  notFoundComponent: () => <div></div>,
  enterLocation: { pathname: "", search: "?", hash: "#" },
  ascendRouteNodeList: [],
  dataMatchMap: {},
  staticHandler: undefined, // Only exists on Server-side
})

export function useRouteShardPreparing() {
  const ctx = useContext(RootAppContext)

  return async function (shardPaths: string[]) {
    if (ctx.routeShardPrepareTrigger) {
      return await ctx.routeShardPrepareTrigger(shardPaths)
    }
    throw new Error("shard prepare() is null")
  }
}
