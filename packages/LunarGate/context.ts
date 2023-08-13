export interface SwiftContext {
  req: Request;
  res: Response;
  requestHeaders: Headers; // req 객체에서 복사해온 헤더

  path: string; // 호스트뒤의 url 패스
  location: {
    pathname: string;
    search: string;
    hash: string;
  };
  params: Map<string, string>;

  // 페이지 빌드용
  // pageBuild: {
  //   scripts: {}; // script urls
  //   pageModule: any;
  // };
}
