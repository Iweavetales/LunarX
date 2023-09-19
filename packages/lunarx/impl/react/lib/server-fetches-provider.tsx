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
  directProvidedFetchResult?: PublicServerSideFetchResult<any>
}) {
  const routeCtx = useContext(AppRoutingContext)
  const serverFetchesResult: PublicServerSideFetchResult<any> =
    props.directProvidedFetchResult ?? routeCtx.routeDataMap[props.dataKey]

  console.log(
    "ServerFetchesProvider:dataKey",
    props.dataKey,
    routeCtx.routeDataMap
  )
  if (serverFetchesResult?.error) {
    throw serverFetchesResult.error
  }

  return (
    <ServerFetchesContext.Provider value={{ result: serverFetchesResult }}>
      {props.children}
    </ServerFetchesContext.Provider>
  )
}
