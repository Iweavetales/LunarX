import { RawRouteInfoNode, RawRouteInfoNodeMap } from "~/core/manifest"
import { serializeRawRouteInfoNodeToAncestorPath } from "../helper/serialize-raw-route-info-node-to-ancestor-path"
import { ArrayClone } from "../array"
import { UniversalRouteInfoNode } from "~/core/document-types"
import { convertRawRouteInfoNodeListToUniversal } from "~/core/convert-raw-route-info-node-list-to-universal"
import { AppStructureContext } from "../client-app-structure"
import { HTTPVersion, Instance as RouterInstance } from "find-my-way"
import { AppRouteInstanceContext } from "./app-route-instance-context"
import { serveServerSideRendering } from "./serve-server-side-rendering"
import { serveServerSideFetching } from "./serve-server-side-fetching"

export const GenerateRoutesByAppRoutePattern = (
  rootRouter: RouterInstance<HTTPVersion.V1>,
  appStructureContext: AppStructureContext,
  rawRouteInfoNodeMap: RawRouteInfoNodeMap,
  routePattern: string
) => {
  const routeNode: RawRouteInfoNode = rawRouteInfoNodeMap[routePattern]
  const leafToRootOrderedNodeList = serializeRawRouteInfoNodeToAncestorPath(
    routeNode,
    rawRouteInfoNodeMap
  )

  /**
   * beginToTerminalRouteStem
   * 최상위 라우트 부터 최종적으로 매치된 라우트와 그 사이 라우트노드를 포함한 라우트 노드 배열
   * "/blog/post" 에 매치 되고
   * "/blog"
   * "/blog/post"
   * 라우트가 존재 한다면
   *
   * ["/blog", "/blog/post"] 이 순서로 라우트 노드가 들어 있게 됨
   */
  const rawRouteInfoNodeListRootToLeaf = ArrayClone(
    leafToRootOrderedNodeList
  ).reverse()

  const universalRouteInfoNodeList: UniversalRouteInfoNode[] =
    convertRawRouteInfoNodeListToUniversal(
      rawRouteInfoNodeListRootToLeaf,
      appStructureContext.manifest
    )

  const appRouteInstanceContext = new AppRouteInstanceContext(
    rawRouteInfoNodeListRootToLeaf,
    universalRouteInfoNodeList,
    appStructureContext
  )

  rootRouter.on(
    "GET",
    routePattern,
    serveServerSideRendering,
    appRouteInstanceContext
  )

  /**
   * route 체크 및 SSR 데이터 로드 API
   */
  rootRouter.on(
    "GET", // @Todo: change to post
    "/_/r" + routePattern,
    serveServerSideFetching,
    appRouteInstanceContext
  )
}
