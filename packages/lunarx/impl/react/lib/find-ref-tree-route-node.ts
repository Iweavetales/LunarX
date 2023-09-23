import { RouteTreeNode } from "./router-context"

export function findRefTreeRouteNode(
  tree: RouteTreeNode[],
  findTargetPattern: string
): RouteTreeNode | null {
  //

  const stack = [...tree]
  const depth = 0

  // tree 순회로 대상을 찾는다
  for (let node = stack.pop(); node; node = stack.pop()) {
    if (node.matchPattern === findTargetPattern) {
      return node
    }

    if (node.children.length > 0) {
      stack.push(...node.children)
    }
  }

  return null
}
