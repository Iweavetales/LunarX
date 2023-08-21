export function GetUrlPath(url: string) {
  const urlPath = url.replace(/^https?:\/\/[a-zA-Z0-9-.]+(:?[0-9]+?)\//, "/")
  return urlPath
}

export function CutOffQuery(url: string) {
  const queryStartIndex = url.indexOf("?")
  return url.substring(0, queryStartIndex === -1 ? url.length : queryStartIndex)
}
