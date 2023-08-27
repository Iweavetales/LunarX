import { IncomingMessage } from "http"
import { HTTPHeaders } from "./http-headers.server"

export type PageParams = {
  [name: string]: undefined | string | string[]
}

export interface ServerContext {
  req: IncomingMessage
  requestHeaders: HTTPHeaders // req 객체에서 복사해온 헤더
  responseHeaders: HTTPHeaders // req 객체에서 복사해온 헤더

  path: string // 호스트뒤의 url 패스
  location: {
    pathname: string
    search: string
    hash: string
  }
  params: PageParams

  // 페이지 빌드용
  // pageBuild: {
  //   scripts: {}; // script urls
  //   pageModule: any;
  // };
}

export default ServerContext
