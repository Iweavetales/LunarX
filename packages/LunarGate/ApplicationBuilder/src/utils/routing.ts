import { BuiltShardInfo, RouteNode, RouteNodeMap } from '~/lib/Manifest';

export function BuildRouteNodeMap(entries: { [entryPath: string]: BuiltShardInfo }): RouteNodeMap {
  let routeNodeMap: RouteNodeMap = {};

  let entryPaths = Object.keys(entries);

  /**
   * 라우트 패턴에 해당하는 프래그먼트 매치 맵
   */
  let routePatternToShardMap: { [routePattern: string]: BuiltShardInfo } = {};
  let serverSideShardsInRouteDir: { [routePattern: string]: BuiltShardInfo } = {}; // 아래에서 라우트 맵을 완성 할 때 참조되는 맵 오브젝트

  for (let i = 0; i < entryPaths.length; i++) {
    let entryPath = entryPaths[i];
    let entryShard = entries[entryPath];

    // entry file 명이 _ 로 시작하는 파일은 라우트 하지 않는다.
    if (entryShard.entryFileName && /^_/.test(entryShard.entryFileName)) {
      continue;
    }

    /**
     * route directory 에 위치한 shard 인가체크
     * -> 라우트가 가능한 엔트리
     */
    let startedWithAppRoute = /^app\/routes/.test(entryPath);
    if (startedWithAppRoute) {
      if (entryShard.isServerSideShard) {
        /**
         * 서버사이드 샤드는 아래에 라우트 맵을 완성할 때 각 라우트에 해당하는 서버사이드 로더 entryPath 가 입력될 수 있도록 분류 해둔다
         */

        let pathFromRouteRoot = entryPath.replace(/^app\/routes/, '');
        // server side script 라면 라우트 엔트리의 서버사이드 샤드일수 있으므로 관련처리
        let routePattern = convertEntryPathToRoutePatternPath(pathFromRouteRoot, true);

        serverSideShardsInRouteDir[routePattern] = entryShard;
      } else {
        /**
         * 라우트 엔트리경로로 라우트 패턴으로 변환하여 라우트 패턴맵으로 입력
         */
        let pathFromRouteRoot = entryPath.replace(/^app\/routes/, '');

        // routable entry
        let routePattern = convertEntryPathToRoutePatternPath(pathFromRouteRoot);

        routePatternToShardMap[routePattern] = entryShard;
      }
    }
  }

  let routePatterns = Object.keys(routePatternToShardMap);
  /**
   * 항상 상위 라우팅은 미리 생성되어 있도록 순서를 정의하기 위해
   * routePath 길이가 작은 순서대로 정렬된 entryKey
   */
  let sortedRoutePatternsByLength = routePatterns.sort((a, b) => {
    // let aEntry = entries[a];
    // let bEntry = entries[b];
    // return aEntry.entryPoint - bEntry.entryPoint;

    return a.length - b.length;
  });

  /**
   * 길이가 짧은 순서대로 정렬된 라우트 패턴 배열로 라우트 노드 맵을 최종적으로 생성 한다.
   */
  for (let i = 0; i < sortedRoutePatternsByLength.length; i++) {
    let routePattern = sortedRoutePatternsByLength[i];
    let entryShard = routePatternToShardMap[routePattern];

    /**
     * 상위 라우트 패턴 찾기
     * 지금까지 생성된 라우트 맵 내에서 현재 라우트패턴의 상위 라우트 패턴을 찾는다
     * 상위 패턴에 해당하는 라우트가 존재 할 경우 반드시 라우트 맵에 생성이 되어 있다( 라우트패턴의 길이가 짧은 순서대로 맵을 생성 하기 때문에 )
     */
    let upperRoutePattern = FindUpperRoutePattern(routeNodeMap, routePattern);

    if (upperRoutePattern) {
      // 상위 라우트 노드에 children 배열이 생성되어 있지 않다면 빈배열을 할당
      if (!routeNodeMap[upperRoutePattern].childrenRoutePatterns) {
        routeNodeMap[upperRoutePattern].childrenRoutePatterns = [];
      }

      routeNodeMap[upperRoutePattern].childrenRoutePatterns!.push(routePattern);
    }

    let serverSideRouteLoaderShard = serverSideShardsInRouteDir[routePattern];
    routeNodeMap[routePattern] = {
      routePattern: routePattern,
      entryPath: entryShard.entryPoint,

      /**
       * 위에서 찾은 상위라우터를 입력한다
       * 그리고, 상위라우트가 루트패스("/") 일 경우 상위라우터로 지정 하지 않는다.
       *  루트 패스는 하위 라우트가 존재 하지 않고 네스티트 라우트 랜더링을 하지 않기 때문이가
       */
      upperRoutePattern: upperRoutePattern === '/' ? undefined : upperRoutePattern,

      /**
       * 이 라우트에 해당하는 서버사이드 로더(somePage.server.ts) 샤드가 존재 한다면 해당 샤드의 entryPoint 를 입력
       */
      serverSideEntryPath: serverSideRouteLoaderShard ? serverSideRouteLoaderShard.entryPoint : undefined,
    };
  }

  return routeNodeMap;
}

function FindUpperRoutePattern(routeNodeMap: RouteNodeMap, routePattern: string): string | undefined {
  //
  let routePatternTokens = routePattern.split('/');

  /**
   * 끝에서 부터 토큰 하나씩 제거 하면서 상위라우트가 routeNodeMap 에 등록 되어 있는지 확인 후
   * 등록되어 있다면 해당 라우트 패턴을 반환한다
   *
   * pop() 으로 시작하는 이유는 자기자신을 제외 해야 하기 때문
   * /article/:fullId/:title 의 부모를 찾기 위해선 /article/:fullId 부터 매치를 해야 한다
   */
  while (routePatternTokens.pop() !== undefined) {
    let guessParentRoutePattern = routePatternTokens.join('/');
    if (routePatternTokens.length === 1) {
      guessParentRoutePattern = '/';
    }

    if (routeNodeMap[guessParentRoutePattern] !== undefined) {
      return guessParentRoutePattern;
    }
  }

  return undefined;
}

function convertEntryPathToRoutePatternPath(
  entryPath: string,
  removeServerSideEntryShardMark: boolean = false,
): string {
  let routePath = entryPath.replace(/\.tsx?$/, ''); // tsx 확장자 제거
  routePath = routePath.replace(/^\/?/, '/'); // 제일 앞부분에 / 를 추가
  routePath = routePath.replace(/\$/g, ':'); // 파라미터 경로화 /$ 를 /: 로 치환

  if (removeServerSideEntryShardMark) {
    // server side shard 파일에 두번째 확장자로 붙는 .server 를 제거 하여 저장
    routePath = routePath.replace(/\.server$/, '');
  }

  /**
   마지막 경로가 "index" 로 끝나면 index 를 제거하고 / 에 매치되도록 변경한다.
   */
  routePath = routePath.replace(/(^index$)|\/index$/, '/');

  return routePath;
}
