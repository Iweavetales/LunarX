import { IncomingMessage } from "http"
import { MutableHTTPHeaders } from "./http-headers.server"
import { UniversalRouteInfoNode, MatchPattern } from "~/core/document-types"
import { PublicServerSideFetchResult } from "~/core/context"

export type PageParams = {
  [name: string]: undefined | string | string[]
}

export interface ServerContext {
  req: IncomingMessage
  requestHeaders: MutableHTTPHeaders // req 객체에서 복사해온 헤더
  responseHeaders: MutableHTTPHeaders // req 객체에서 복사해온 헤더

  path: string // 호스트뒤의 url 패스
  location: {
    pathname: string
    search: string
    hash: string
  }
  routeFetchDataMap: {
    [routePattern: MatchPattern]: any
  }
  userStore: { [key: string]: any }
  matchedRoutes: UniversalRouteInfoNode[]
  params: PageParams

  // 페이지 빌드용
  // pageBuild: {
  //   scripts: {}; // script urls
  //   pageModule: any;
  // };
}

export default ServerContext
export type ThrownErrorResult = {
  id?: string
  data?: any
  msg?: string
  statusCode?: number
  error: any
}
export type ServerSideFetchReturn<DataResultType> = {
  /**
   * if throwError is exists
   * throwError will be passed to `/error.server` and try to render error route
   */
  throwError?: ThrownErrorResult | null
  data?: DataResultType | null
  redirect?: string
}

export type ServerSideFetchesReturnMap = {
  [pattern: string]: ServerSideFetchReturn<any>
}

// for /_init.server
export declare type InitServerFunctionReturn = boolean | ThrownErrorResult
export declare type initServerFunction = (
  context: ServerContext
) => Promise<InitServerFunctionReturn>

// for /[route].server
export declare type ServerFetches<DataResultType> = (
  context: ServerContext
) => Promise<ServerSideFetchReturn<DataResultType>>

/**
 * ServerErrorHandler must return processed error as Public for security❗️
 */
export declare type ServerErrorHandler<DataResultType> = (
  context: ServerContext,
  thrownError: ThrownErrorResult
) => Promise<PublicServerSideFetchResult<DataResultType>>
