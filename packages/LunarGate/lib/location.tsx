// from @remix-run/router/history.ts
export type Location = {
  pathname: string;
  search: string;
  hash: string;

  state?: any;
  key?: string;
};
export function GetUrlPath(url: string) {
  const urlPath = url.replace(/^https?:\/\/[a-zA-Z0-9-.]+(:?[0-9]+?)\//, '/');
  return urlPath;
}

export function UrlToLocation(url: string): Location {
  const path = GetUrlPath(url);
  const searchMarkIndex = path.indexOf('?');
  const hashMarkIndex = path.indexOf('#');

  /**
   * search mark '?' 또는 hash mark '#' 가 시작되는 인덱스
   * ? 가 # 보다 앞에 오기 때문에 ?가 없을 경우 hash 의 인덱스로 지정 하기 위해 Math.min 을 사용하였음
   */
  const markStartIndex = Math.min(searchMarkIndex, hashMarkIndex);

  const urlPathLength = path.length;

  return {
    pathname: path.substring(0, markStartIndex === -1 ? urlPathLength : markStartIndex),
    search:
      searchMarkIndex !== -1
        ? path.substring(searchMarkIndex, hashMarkIndex !== -1 ? hashMarkIndex : urlPathLength)
        : '',
    hash: hashMarkIndex !== -1 ? path.substring(hashMarkIndex, urlPathLength) : '',
  };
}
