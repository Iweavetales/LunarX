import { RawRouteInfoNode, RawRouteInfoNodeMap } from "~/core/manifest"

export const serializeRawRouteInfoNodeToAncestorPath = (
  routeNode: RawRouteInfoNode,
  rawRouteInfoNodeMap: RawRouteInfoNodeMap
): RawRouteInfoNode[] => {
  const serializeAncestorPath: RawRouteInfoNode[] = []
  for (let current = routeNode; current; ) {
    serializeAncestorPath.push(current)
    if (current.upperRoutePattern) {
      current = rawRouteInfoNodeMap[current.upperRoutePattern]
    } else {
      break
    }
  }
  return serializeAncestorPath
}
