import { createContext } from "react"
import { Location } from "~/core/location"
import { RouteTreeNode } from "../router"
import { PublicServerSideFetchResult } from "~/core/context"

export type pushMethod = (
  href: string,
  options?: { query?: { [name: string]: string | string[] } }
) => void

type SwiftRouterProvides = {
  push: pushMethod
  browsing: boolean
  currentLocation: {
    auto: boolean
  } & Location
  routeTree: RouteTreeNode[]
  routeDataMap: { [pattern: string]: PublicServerSideFetchResult<any> }
  softReload: () => Promise<void>
}

export const AppRouterContext = createContext<SwiftRouterProvides>({
  push: (href, options) => {
    /**/
  },
  currentLocation: { auto: false, hash: "", pathname: "", search: "" },
  browsing: false,
  routeTree: [],
  routeDataMap: {},
  softReload: async () => {
    /**/
  },
})
