import { createContext } from "react"
import { Location } from "~/core/location"
import { RouteTreeNode } from "../router"

type SwiftRouterProvides = {
  push: (href: string, options?: { query?: { [name: string]: any } }) => void
  browsing: boolean
  currentLocation: {
    auto: boolean
  } & Location
  routeTree: RouteTreeNode[]
  routeDataMap: { [pattern: string]: any }
  softReload: () => Promise<void>
}

export const AppRouterContext = createContext<SwiftRouterProvides>({
  push: () => {
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
