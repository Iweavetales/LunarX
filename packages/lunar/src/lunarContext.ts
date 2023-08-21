import { IncomingMessage } from "http"
import { HTTPHeaders } from "../lib/HTTPHeaders.server"

export interface LunarContext {
  req: IncomingMessage
  requestHeaders: HTTPHeaders // req 객체에서 복사해온 헤더
  responseHeaders: HTTPHeaders // req 객체에서 복사해온 헤더

  path: string // 호스트뒤의 url 패스
  location: {
    pathname: string
    search: string
    hash: string
  }
  params: {
    [k: string]: string | undefined
  }

  // 페이지 빌드용
  // pageBuild: {
  //   scripts: {}; // script urls
  //   pageModule: any;
  // };
}
