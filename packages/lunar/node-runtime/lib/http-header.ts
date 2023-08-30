import { MutableHTTPHeaders } from "../../lib/http-headers.server"

export function rawHeaderStringArrayToMutableHTTPHeaders(
  rawHeaders: string[]
): MutableHTTPHeaders {
  const requestHeaders = new MutableHTTPHeaders()
  const headerCount = rawHeaders.length / 2

  for (let i = 0; i < headerCount; i++) {
    const headerPosition = i * 2
    const headerName = rawHeaders[headerPosition]
    const headerValue = rawHeaders[headerPosition + 1]

    requestHeaders.append(headerName, headerValue || "")
  }

  return requestHeaders
}
