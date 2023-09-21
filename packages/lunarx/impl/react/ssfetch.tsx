import { useContext } from "react"
import { ServerFetchesContext } from "./lib/server-fetches-context"
import { PublicErrorInfo, PublicServerSideFetchResult } from "~/core/context"
import { SSRErrorContext } from "./lib/ssr-error-provider"

export function useServerFetches<
  FetchData = unknown,
  ErrorData = unknown
>(): PublicServerSideFetchResult<FetchData, ErrorData> | null {
  const ctx = useContext(ServerFetchesContext)

  return ctx.result
}

export function useSSRError<
  ErrorData = unknown
>(): PublicErrorInfo<ErrorData> | null {
  const ctx = useContext(SSRErrorContext)

  return ctx || null
}
