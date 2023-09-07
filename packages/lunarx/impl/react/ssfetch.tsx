import React, { useContext } from "react"
import { ServerFetchesContext } from "./lib/server-fetches-context"
import { PublicServerSideFetchResult } from "~/core/context"

export type RouteFetchResult = {
  data?: any
  error?: {
    id: string
  }
}

export const useServerFetches =
  function (): PublicServerSideFetchResult<any> | null {
    const ctx = useContext(ServerFetchesContext)

    return ctx.result || null
  }
