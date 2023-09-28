// from @remix-run/router/history.ts
import { ensureArray } from "~/core/functions/array"

export type Location = {
  pathname: string
  search: string
  hash: string

  state?: any
  key?: string
}
export function GetUrlPath(url: string) {
  const urlPath = url.replace(/^https?:\/\/[a-zA-Z0-9-.]+(:?[0-9]+?)\//, "/")
  return urlPath
}

export function UrlStringToURLComponents(url: string): Location {
  const urlPath = GetUrlPath(url)
  const searchStartIndex = urlPath.indexOf("?")
  const hashStartIndex = urlPath.indexOf("#")

  const urlPathLength = urlPath.length

  return {
    pathname: urlPath.substring(
      0,
      searchStartIndex === -1 ? urlPathLength : searchStartIndex
    ),
    search:
      searchStartIndex !== -1
        ? urlPath.substring(
            searchStartIndex,
            hashStartIndex !== -1 ? hashStartIndex : urlPathLength
          )
        : "",
    hash:
      hashStartIndex !== -1
        ? urlPath.substring(hashStartIndex, urlPathLength)
        : "",
  }
}

export type QueryMap = { [key: string]: string | string[] }
export function SearchStringToQueryMap(search: string): QueryMap {
  const qMarkIndex = search.indexOf("?")
  const searchContents = search.slice(qMarkIndex + 1)
  const pairs = searchContents.split("&").map((queryPair) => {
    const tokens = queryPair.split("=")
    return [tokens[0], tokens[1]]
  })

  return pairs.reduce((acc, cur) => ({ ...acc, [cur[0]]: cur[1] }), {})
}

export function QueryMapToSearchString(queryMap: QueryMap): string {
  return Object.keys(queryMap)
    .map((queryKey) =>
      ensureArray(queryMap[queryKey])
        .filter(Boolean)
        .map((queryValue) => `${queryKey}=${queryValue}`)
        .join("&")
    )
    .filter(Boolean)
    .join("&")
}
