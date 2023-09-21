import { createContext } from "react"
import { PublicServerSideFetchResult } from "~/core/context"

type RouteDataValues = {
  result: PublicServerSideFetchResult<unknown, unknown> | null
}
export const ServerFetchesContext = createContext<RouteDataValues>({
  result: null,
})
