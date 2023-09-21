import React, { useContext } from "react"
import { AppRoutingContext } from "./router-context"
import { ServerFetchesContext } from "./server-fetches-context"
import { PublicServerSideFetchResult } from "~/core/context"

export const ServerFetchesProvider = function (props: {
  // result: RouteFetchResult;
  children?: React.ReactNode
  dataKey: string

  /**
   * Provided fetch result without AppRoutingContext
   */
  directProvidedFetchResult?: PublicServerSideFetchResult<any, any>
}) {
  const routeCtx = useContext(AppRoutingContext)
  const serverFetchesResult: PublicServerSideFetchResult<any, any> =
    props.directProvidedFetchResult ?? routeCtx.routeDataMap[props.dataKey]

  if (serverFetchesResult?.error) {
    if (serverFetchesResult.error.redirect) {
      if (typeof location !== "undefined") {
        console.info(
          `Will redirect to ${serverFetchesResult.error.redirect} by server result`
        )
        location.href = serverFetchesResult.error.redirect
      }
      return
    }

    throw serverFetchesResult.error
  }

  return (
    <ServerFetchesContext.Provider value={{ result: serverFetchesResult }}>
      {props.children}
    </ServerFetchesContext.Provider>
  )
}
