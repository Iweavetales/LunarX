/**
 * 윈도우 파일시스템 경로 구분자 "\" 를 url 과 리눅스 파일시스템 경로 구분자인 "/" 로 치환 한다
 */
export const normalizePath = (path: string) => path.replace(/\\/g, "/")
