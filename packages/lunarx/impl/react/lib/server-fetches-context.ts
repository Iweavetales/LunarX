import { createContext } from "react"
import { PublicServerSideFetchResult } from "~/core/context"

type RouteDataValues = {
  result?: PublicServerSideFetchResult<any>
}
export const ServerFetchesContext = createContext<RouteDataValues>({})
