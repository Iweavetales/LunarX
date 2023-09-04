import React, { useContext } from "react"
import { ServerFetchesContext } from "./lib/server-fetches-context"

export type RouteFetchResult = {
  data?: any
  error?: {
    id: string
  }
}

export const useServerFetches = function (): RouteFetchResult | null {
  const ctx = useContext(ServerFetchesContext)

  return ctx.result || null
}

export function NewServerFetchError(
  internalError: Error,
  loggingData: { [key: string]: any },
  publicMessage?: string,
  errorCode?: number
) {
  return {
    serverFetchCustomError: true,
    publicMessage: publicMessage,
    errorCode: errorCode,
    internalError: internalError,
    internalData: loggingData,
  }
}
