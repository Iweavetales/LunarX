export type PublicErrorInfo = {
  id?: string
  data?: any
  msg: string
}
// serverSideFetchResult for client
export type PublicServerSideFetchResult<DataResultType> = {
  /**
   * if throwError is exists
   * throwError will be passed to `/error.server` and try to render error route
   */
  error?: PublicErrorInfo | null
  data?: DataResultType | null
}
