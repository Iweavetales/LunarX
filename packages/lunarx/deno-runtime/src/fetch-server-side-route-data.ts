import { uuidV5Generate } from "./deps.ts"
import { RawRouteInfoNode } from "../../lib/manifest.ts"
import { WebAppStructure } from "./web-app-structure.ts"
import { ServerContext } from "../lib/lunar-context.ts"

const NAMESPACE_URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8"

export type ServerSideRouteFetchResult = {
  error?: {
    id: string
    info?: any
  }
  data?: any
}
export async function FetchingServerSideRouteData(
  routeNode: RawRouteInfoNode,
  webApp: WebAppStructure,
  context: ServerContext
) {
  const serverSideEntry = routeNode.serverSideEntryPath
  if (serverSideEntry) {
    const routeLoaderShardInfo = webApp.Manifest.entries[serverSideEntry]
    const serverSideLoaderModule =
      webApp.LoadedEntryModuleMap[routeLoaderShardInfo.shardPath]

    if (serverSideLoaderModule) {
      const fetchFunction = serverSideLoaderModule.serverFetches

      if (fetchFunction) {
        try {
          const fetchResult = await fetchFunction(context)

          return {
            routerPattern: routeNode.routePattern,
            result: { data: fetchResult && fetchResult.data },
          }
        } catch (e) {
          /**
           * 라우트별 fetch 를 실행 중에 에러가 발생하면 실제 error 메시지는 console 또는 로그 시스템으로만 출력하고
           * 실제로 유저에게 노출되는 데이터에는 에러 내용이 포함되지 않도록 한다.
           *
           * 내부적으로 에러를 출력 할 때 errorId 를 uuid 를 통해 발급 하고
           * 발급된 에러 아이디만 유저에게 공개 한다.( 원할한 고객지원을 위해 )
           *
           * @ToDo 추후에 클라이언트 ID 도 포함해서 로그를 남기자
           */
          const errorId = uuidV5Generate(
            "",
            new TextEncoder().encode("lunargate")
          )
          console.error(
            `Unexpected error: PageRenderError/ssrFetchError/${errorId}: error occurs when fetching server side data about route[${routeNode.routePattern}].`,
            e
          )

          /**
           * 브라우저 데이터로 넘어갈 error 데이터 생성
           * (!) 주의: 아래 데이터는 프론트엔드로 넘어가는 데이터이다 프론트엔드 유저에게 노출 될 수 있는 데이터이므로 공개범위를 확실히 해야 한다.
           * 추후 데이터 구조가 변경 될 수 있음,
           */

          return {
            routerPattern: routeNode.routePattern,
            result: { error: { id: errorId } },
          }
        }
      }
    }
  }

  return { routerPattern: routeNode.routePattern, result: undefined }
}
