import {
  TopLevelUniversalRouteInfoNodes,
  UniversalRouteInfoNode,
} from "~/core/document-types"

export function FindRouteNodeByPattern(
  matchPattern: string,
  topUniversalRouteInfoNodes: TopLevelUniversalRouteInfoNodes
): UniversalRouteInfoNode[] {
  const tracedNodes: UniversalRouteInfoNode[] = [] // 노드 계보
  //
  const patternToken = matchPattern.split("/")

  const patternTokenCount = patternToken.length
  for (let i = 0; i < patternTokenCount; i++) {
    //
    const patternThatJoinedTokens =
      patternToken.slice(0, i + 1).join("/") || "/" // 1 번째엔 "" 빈 문자열이 나오므로 빈문자열일 경우 "/" 로 변경하여 사용
    const lastTraced = tracedNodes[tracedNodes.length - 1]
    const testTargets = lastTraced
      ? lastTraced.childNodes
      : topUniversalRouteInfoNodes

    if (testTargets) {
      const bridgeNode = testTargets.find((node) => {
        return node.matchPattern === patternThatJoinedTokens
      })

      if (bridgeNode) {
        tracedNodes.push(bridgeNode)
      }
    }
  }

  return tracedNodes
}
