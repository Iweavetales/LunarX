import { UniversalRouteInfoNode } from "~/core/document-types"
import { RouteTreeNode } from "../router"
import { findRefTreeRouteNode } from "./find-ref-tree-route-node"

/**
 * graftRouteNodesToRouteTree
 * 라우트 tree 에 정해진 [터미널 라우트 노드] 까지의 라우트 노드 줄기를 한 줄기씩 붙이는 함수
 * 어차피 한번에 여러개의 터미널 라우트에 접근하지 않고 페이지를 이동 할 때도 하나의 터미널로만 이동 하기 때문에 한 줄기씩 붙여도 문제가 없다.
 *
 * route tree 에 가지를 접붙힌다
 * @param ascendRouteNodeList
 *  상위 노드(ex, "/blog")부터 지정된 하위 노드(ex, "/blog/post/id")까지 이어진 하나의 줄기에 해당하는 노드 목록(ex, "/blog", "/blog/post", "/blog/post/id")
 *  이 줄기외에 다른 줄기로 이어지는 노드는 입력하면 안된다 (ex, "/blog/edit")
 *  만약 다른 줄기로 이어지는 노드를 새로 접붙이려면 해당 노드까지 이어지는 리스트를 가지고 다시 graftRouteNodesToRouteTree() 를 호출 해야 한다
 * @param tree
 *
 * @return [newTree:RouteTreeNode[], changed:boolean]
 */
export function graftRouteNodesToRouteTree(
  ascendRouteNodeList: UniversalRouteInfoNode[],
  trees: RouteTreeNode[]
): [RouteTreeNode[], boolean] {
  //
  const clonedTrees: RouteTreeNode[] = JSON.parse(JSON.stringify(trees))
  let changed = false
  const ascendNodeCount = ascendRouteNodeList.length

  /**
   * 입력된 ascendRouteNodeList 의 라우트 노드를 차례대로 돌아가며 tree 에 존재하는 동일한 라우트 노드외에 tree 에 존재하지 않는 라우트 노드를 tree 에 추가 한다.
   */
  for (let i = 0; i < ascendNodeCount; i++) {
    const currentNode = ascendRouteNodeList[i]

    const upperRouteNodePattern = currentNode.upperRouteMatchPattern
    if (upperRouteNodePattern) {
      const foundUpperNode = findRefTreeRouteNode(
        clonedTrees,
        upperRouteNodePattern
      )
      if (foundUpperNode) {
        if (
          foundUpperNode.children.findIndex(
            (node) => node.matchPattern === currentNode.matchPattern
          ) === -1
        ) {
          foundUpperNode.children.push({ ...currentNode, children: [] })
          changed = true
        }
      } else {
        throw new Error(`Not found upper node[${upperRouteNodePattern}]`)
      }
    } else {
      // 현재 노드의 상위 노드가 지정되어 있지 않고 최상위 노드중 현재 노드가 없으면 현재 노드를 최상위 노드로 편입 시킨다
      if (
        clonedTrees.findIndex(
          (node) => node.matchPattern === currentNode.matchPattern
        ) === -1
      ) {
        clonedTrees.push({ ...currentNode, children: [] })
        changed = true
      }
    }
  }

  return [clonedTrees, changed]
}
