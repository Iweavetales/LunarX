import { RawRouteInfoNode, RawRouteInfoNodeMap } from "~/core/manifest"
/**
 * Serializes a given RawRouteInfoNode and its path to its ancestors into an array.
 *
 * @param {RawRouteInfoNode} routeNode - The starting RawRouteInfoNode that needs to be serialized along with its ancestor path.
 * @param {RawRouteInfoNodeMap} rawRouteInfoNodeMap - A map containing RawRouteInfoNodes indexed by their upperRoutePattern for easy look-up.
 *
 * @returns {RawRouteInfoNode[]} - An array containing the serialized RawRouteInfoNodes from the given node to its ancestors.
 */
export const serializeRawRouteInfoNodeToAncestorPath = (
  routeNode: RawRouteInfoNode,
  rawRouteInfoNodeMap: RawRouteInfoNodeMap
): RawRouteInfoNode[] => {
  // Initialize an array to hold the serialized path.
  const serializeAncestorPath: RawRouteInfoNode[] = []

  // Start from the given node and traverse upwards to its ancestors.
  for (let current = routeNode; current; ) {
    // Add the current node to the serialized path.
    serializeAncestorPath.push(current)

    // Check if the current node has an ancestor (upperRoutePattern).
    if (current.upperRoutePattern) {
      // Update the current node to its ancestor for the next iteration.
      current = rawRouteInfoNodeMap[current.upperRoutePattern]
    } else {
      // If no ancestor exists, break the loop.
      break
    }
  }

  // Return the serialized path as an array.
  return serializeAncestorPath
}
