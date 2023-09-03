import { ServerContext, PageParams } from "~/core/lunar-context"

import { IncomingMessage } from "http"
import { MutableHTTPHeaders } from "~/core/http-headers.server"

export function makeServerContext(
  req: IncomingMessage,
  urlPath: string,
  params: PageParams,
  requestHeaders: MutableHTTPHeaders,
  responseHeaders: MutableHTTPHeaders
): ServerContext {
  const searchMarkIndex = urlPath.indexOf("?")
  const hashMarkIndex = urlPath.indexOf("#")

  const urlPathLength = urlPath.length

  return {
    req: req,
    requestHeaders: requestHeaders,
    responseHeaders: responseHeaders,
    path: urlPath,
    params: params,
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
  }
}
