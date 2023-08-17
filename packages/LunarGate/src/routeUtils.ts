import {TopUniversalRouteNodes, UniversalRouteNode} from "../lib/DocumentTypes";


export function FindRouteNodeByPattern(
  matchPattern: string,
  topUniversalRouteNodes: TopUniversalRouteNodes,
): UniversalRouteNode[] {
  const tracedNodes: UniversalRouteNode[] = []; // 노드 계보
  //
  const patternToken = matchPattern.split('/');

  console.log('Find', matchPattern);
  const patternTokenCount = patternToken.length;
  for (let i = 0; i < patternTokenCount; i++) {
    //
    const patternThatJoinedTokens = patternToken.slice(0, i + 1).join('/') || '/'; // 1 번째엔 "" 빈 문자열이 나오므로 빈문자열일 경우 "/" 로 변경하여 사용
    const lastTraced = tracedNodes[tracedNodes.length - 1];
    const testTargets = lastTraced ? lastTraced.childNodes : topUniversalRouteNodes;

    console.log(patternThatJoinedTokens, lastTraced, testTargets);
    if( testTargets ){
      const bridgeNode = testTargets.find(node => {
        return node.matchPattern === patternThatJoinedTokens;
      });

      if (bridgeNode) {
        tracedNodes.push(bridgeNode);
      }
    }
  }

  console.log(tracedNodes);
  return tracedNodes;
}
