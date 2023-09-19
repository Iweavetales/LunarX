import React, { useContext } from "react"
import { ServerFetchesContext } from "./lib/server-fetches-context"
import { PublicServerSideFetchResult } from "~/core/context"

export const useServerFetches =
  function (): PublicServerSideFetchResult<any> | null {
    const ctx = useContext(ServerFetchesContext)

    return ctx.result || null
  }
