import { LunarJSManifest, RawRouteInfoNode } from "~/core/manifest"
import { UniversalRouteInfoNode } from "~/core/document-types"

export const convertRawRouteInfoNodeListToUniversal = (
  rawRouteInfoNodeList: RawRouteInfoNode[],
  manifest: LunarJSManifest
): UniversalRouteInfoNode[] => {
  return rawRouteInfoNodeList.map((node) => ({
    matchPattern: node.routePattern,
    upperRouteMatchPattern: node.upperRoutePattern,
    shardPath: manifest.entries[node.entryPath].shardPath,
  }))
}
