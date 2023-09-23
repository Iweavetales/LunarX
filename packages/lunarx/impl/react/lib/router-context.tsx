import { createContext } from "react"
import { Location } from "~/core/location"
import { PublicServerSideFetchResult } from "~/core/context"
import { AsyncEmptyFunction, EmptyFunction } from "./constants"
import { UniversalRouteInfoNode } from "~/core/document-types"

export type PrepareForNavigate = (
  href: string,
  finishCallback: () => void,
  options?: { query?: { [name: string]: string | string[] } }
) => void

export type BeforeRoutingHandler = () => boolean
export type RouteTreeNode = UniversalRouteInfoNode & {
  children: RouteTreeNode[]
}
type SwiftRouterProvides = {
  prepareNavigate: PrepareForNavigate
  browsing: boolean
  currentLocation: {
    auto: boolean
  } & Location
  routeTree: RouteTreeNode[]
  routeDataMap: { [pattern: string]: PublicServerSideFetchResult<any> }
  softReload: () => Promise<void>
  setRouteTree: (tree: RouteTreeNode[]) => void
  setCurrentLocation: (location: { auto: boolean } & Location) => void

  onBeforeRouting: (id: string, handler: BeforeRoutingHandler) => void
  offBeforeRouting: (id: string, handler: BeforeRoutingHandler) => void
}

export const AppRoutingContext = createContext<SwiftRouterProvides>({
  prepareNavigate: EmptyFunction,

  currentLocation: { auto: false, hash: "", pathname: "", search: "" },
  browsing: false,
  routeTree: [],
  routeDataMap: {},
  softReload: AsyncEmptyFunction,
  setRouteTree: EmptyFunction,
  setCurrentLocation: EmptyFunction,
  onBeforeRouting: EmptyFunction,
  offBeforeRouting: EmptyFunction,
})
