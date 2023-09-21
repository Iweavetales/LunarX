import React, { createContext, useContext } from "react"
import { PublicErrorInfo, PublicServerSideFetchResult } from "~/core/context"
import { AppRoutingContext } from "./router-context"

export const SSRErrorContext = createContext<PublicErrorInfo<any> | null>(null)

export const SSRErrorContextProvider = function (props: {
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

  return (
    <SSRErrorContext.Provider value={serverFetchesResult?.error ?? null}>
      {props.children}
    </SSRErrorContext.Provider>
  )
}
