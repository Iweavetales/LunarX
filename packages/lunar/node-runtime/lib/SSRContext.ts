import { LunarContext } from "../../lib/lunar-context"
import { GetUrlPath } from "./urlUtils"
import { IncomingMessage } from "http"
import { HTTPHeaders } from "../../lib/http-headers.server"

export function makeSwiftContext(
  req: IncomingMessage,
  urlPath: string,
  params: { [k: string]: string | undefined },
  requestHeaders: HTTPHeaders,
  responseHeaders: HTTPHeaders
): LunarContext {
  const searchMarkIndex = urlPath.indexOf("?")
  const hashMarkIndex = urlPath.indexOf("#")

  /**
   * search mark '?' 또는 hash mark '#' 가 시작되는 인덱스
   * ? 가 # 보다 앞에 오기 때문에 ?가 없을 경우 hash 의 인덱스로 지정 하기 위해 Math.min 을 사용하였음
   */
  const markStartIndex = Math.min(searchMarkIndex, hashMarkIndex)

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
        markStartIndex === -1 ? urlPathLength : markStartIndex
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
