export type PublicErrorInfo<DataType = unknown> = {
  id?: string
  data?: DataType
  msg: string
  statusCode?: number
  redirect?: string
}
// serverSideFetchResult for client
export type PublicServerSideFetchResult<
  DataResultType = unknown,
  ErrorData = unknown
> = {
  /**
   * if throwError is exists
   * throwError will be passed to `/error.server` and try to render error route
   */
  error?: PublicErrorInfo<ErrorData> | null
  data?: DataResultType | null
}
