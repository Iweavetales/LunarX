import React, { useContext, useEffect } from "react"
import { UniversalRouteInfoNode } from "~/core/document-types"
import { AppRouterContext } from "./lib/router-context"

export type ComponentModule = any
/**
 * shard 로더
 * 실제 함수 형식의 컴포넌트를 반환 해야 한다
 */

export type ShardLoader = (shardPath: string) => Promise<ComponentModule>
export type RouteTreeNode = UniversalRouteInfoNode & {
  children: RouteTreeNode[]
}

export const EmptyRoute = (props: {}) => {
  const routeCtx = useContext(AppRouterContext)

  useEffect(() => {
    console.log("empty route")
  })
  return <div>404 Not found</div>
}

export function Link(props: {
  href: string
  children?: React.ReactNode
  className?: string
}) {
  const ctx = useContext(AppRouterContext)

  return (
    <a
      onClick={(e) => {
        // route 체크 후 라우터 반영

        // location.href = props.href;
        ctx.push(props.href, {})

        e.preventDefault()
      }}
      href={props.href}
      className={props.className}
    >
      {props.children}
    </a>
  )
}

/**
 * url 새로고침을 하지 않고 현재 페이지의 내용을 새로 로드하여 UI에 반영하는 함수
 * location.reload() 와 비슷 하지만,
 * 현재 페이지 상태를 어느정도 유지 하면서 서버측 데이터를 다시 로딩하는 목적으로 사용 할 수 있다.
 */
export const useSoftReload = () => {
  return useContext(AppRouterContext).softReload
}

export const useSwiftRouter = () => {
  return useContext(AppRouterContext)
}
