import { PublicServerSideFetchResult } from "~/core/context"

export type TAppData = {
  rd: {
    [routePattern: string]: PublicServerSideFetchResult<any>
  }
}
