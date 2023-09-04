import { createContext } from "react"
import { RouteFetchResult } from "../ssfetch"

type RouteDataValues = {
  result?: RouteFetchResult
}
export const ServerFetchesContext = createContext<RouteDataValues>({})
