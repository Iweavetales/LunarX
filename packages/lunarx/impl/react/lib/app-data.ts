import { RouteFetchResult } from "../ssfetch"

export type TAppData = {
  rd: {
    [routePattern: string]: RouteFetchResult
  }
}
