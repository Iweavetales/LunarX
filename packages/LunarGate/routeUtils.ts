import {TopUniversalRouteNodes, UniversalRouteNode} from "./DocumentTypes";


export function FindRouteNodeByPattern(
  matchPattern: string,
  topUniversalRouteNodes: TopUniversalRouteNodes,
): UniversalRouteNode[] {
  let tracedNodes: UniversalRouteNode[] = []; // 노드 계보
  //
  let patternToken = matchPattern.split('/');

  console.log('Find', matchPattern);
  let patternTokenCount = patternToken.length;
  for (let i = 0; i < patternTokenCount; i++) {
    //
    let patternThatJoinedTokens = patternToken.slice(0, i + 1).join('/') || '/'; // 1 번째엔 "" 빈 문자열이 나오므로 빈문자열일 경우 "/" 로 변경하여 사용
    let lastTraced = tracedNodes[tracedNodes.length - 1];
    let testTargets = lastTraced ? lastTraced.childNodes : topUniversalRouteNodes;

    console.log(patternThatJoinedTokens, lastTraced, testTargets);
    if( testTargets ){
      let bridgeNode = testTargets.find(node => {
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
