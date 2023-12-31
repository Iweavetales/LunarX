import { ServerContext } from "../lib/lunar-context.ts"
import { GetUrlPath } from "./url-utils.ts"

export function makeServerContext(
  req: Request,
  urlPath: string,
  params: Map<string, string>,
  response: Response
): ServerContext {
  const searchMarkIndex = urlPath.indexOf("?")
  const hashMarkIndex = urlPath.indexOf("#")

  /**
   * search mark '?' 또는 hash mark '#' 가 시작되는 인덱스
   * ? 가 # 보다 앞에 오기 때문에 ?가 없을 경우 hash 의 인덱스로 지정 하기 위해 Math.min 을 사용하였음
   */
  const markStartIndex = Math.min(searchMarkIndex, hashMarkIndex)

  const urlPathLength = urlPath.length

  /**
   * 편집 가능한 request header 를 만들기 위해 req.header 를 requestHeader 로 복사 한다
   */
  const requestHeaders = new Headers()
  req.headers.forEach((v, k) => {
    requestHeaders.append(k, v)
  })

  return {
    req: req,
    res: response,
    requestHeaders: requestHeaders,
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
