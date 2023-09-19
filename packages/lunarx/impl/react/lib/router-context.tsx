import { createContext } from "react"
import { Location } from "~/core/location"
import { RouteTreeNode } from "../router"
import { PublicServerSideFetchResult } from "~/core/context"

export type PrepareForNavigate = (
  href: string,
  finishCallback: () => void,
  options?: { query?: { [name: string]: string | string[] } }
) => void

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
}

export const AppRoutingContext = createContext<SwiftRouterProvides>({
  prepareNavigate: () => {
    return
  },

  currentLocation: { auto: false, hash: "", pathname: "", search: "" },
  browsing: false,
  routeTree: [],
  routeDataMap: {},
  softReload: async () => {
    /**/
  },
  setRouteTree: () => {
    return
  },
  setCurrentLocation: () => {
    return
  },
})
