import { ServerContext, PageParams } from "~/core/server-context"

import { IncomingMessage } from "http"
import { MutableHTTPHeaders } from "~/core/http-headers.server"
import { UniversalRouteInfoNode } from "~/core/document-types"
import { SupportingRuntime } from "~/core/runtime"
import { GenerateRandomBytes } from "./random"

const checkRuntime = (): SupportingRuntime => {
  if (typeof Deno !== "undefined") {
    return "deno"
  }

  return "node"
}

export function makeServerContext(
  req: IncomingMessage,
  urlPath: string,
  params: PageParams,
  matchedRoutes: UniversalRouteInfoNode[],
  requestHeaders: MutableHTTPHeaders,
  responseHeaders: MutableHTTPHeaders,
  nonce: string
): ServerContext {
  const searchMarkIndex = urlPath.indexOf("?")
  const hashMarkIndex = urlPath.indexOf("#")

  const urlPathLength = urlPath.length

  return {
    _internal: {
      runtime: checkRuntime(),
    },
    req: req,
    requestHeaders: requestHeaders,
    responseHeaders: responseHeaders,
    path: urlPath,
    params: params,
    matchedRoutes: matchedRoutes,
    routeFetchDataMap: {},
    userStore: {},
    location: {
      pathname: urlPath.substring(
        0,
        searchMarkIndex === -1 ? urlPathLength : searchMarkIndex
      ),
      search:
        searchMarkIndex !== -1
          ? urlPath.substring(
              searchMarkIndex,
              hashMarkIndex !== -1 ? hashMarkIndex : urlPathLength
            )
          : "",
      hash:
        hashMarkIndex !== -1
          ? urlPath.substring(hashMarkIndex, urlPathLength)
          : "",
    },

    nonce: nonce,
  }
}
