import { WebAppStructure } from './WebAppStructure.ts';
import { GetUrlPath } from './urlUtils.ts';
import { GenerateRandomBytes } from './random.ts';
import {
	DocumentSheet,
	UniversalRouteNode,
} from '../../lib/DocumentTypes.ts';
import { RouteNode, RouteNodeMap } from '../../lib/Manifest.ts';
import {
	FetchingServerSideRouteData,
	ServerSideRouteFetchResult,
} from './FetchServerSideRouteData.ts';
import { makeSwiftContext } from './SSRContext.ts';

export function RenderPage(
	currentWorkDirectory: string,
	webApp: WebAppStructure,
	req: Request,
	params: Map<string, string>,
	/**
	 * beginToTerminalRouteStem
	 * 최상위 라우트 부터 최종적으로 매치된 라우트와 그 사이 라우트노드를 포함한 라우트 노드 배열
	 * "/blog/post" 에 매치 되고
	 *
	 * "/blog"
	 * "/blog/post"
	 * 라우트가 존재 한다면
	 *
	 * ["/blog", "/blog/post"] 이 순서로 라우트 노드가 들어 있게 됨
	 */
	ascendFlatRouteNodeList: RouteNode[],
): Promise<Response> {
	// beginToTerminalRouteStem 의 역순으로 라우트 노드를 배열
	// const reverseRouteStem = ArrayClone(ascendFlatRouteNodeList).reverse();
	const routeNodeMap: RouteNodeMap = {};
	for (let i = 0; i < ascendFlatRouteNodeList.length; i++) {
		const routeNode = ascendFlatRouteNodeList[i];
		routeNodeMap[routeNode.routePattern] = routeNode;
	}

	/**
	 * beginToTerminalRouteStem 을 universalNode 배열 로 변환
	 */
	let ascendRouteNodeList: UniversalRouteNode[] | unknown = ascendFlatRouteNodeList.map(
		(node) => ({
			// childNodes:[],
			matchPattern: node.routePattern,
			upperRouteMatchPattern: node.upperRoutePattern,
			shardPath: webApp.Manifest.entries[node.entryPath ?? "??"].shardPath,
		}),
	);

	let entriesArray = Object.keys(webApp.Manifest.entries).map((key) => webApp.Manifest.entries[key])


	let routerServerEntrySource = entriesArray
		.find((entry) => entry.entryFileName === "router.server.js")
	let entryServerEntrySource = entriesArray
		.find((entry) => entry.entryFileName === "entry.server.js")
	if( !( routerServerEntrySource && entryServerEntrySource ) ){
		return Promise.resolve(new Response("Not found core", {
			status: 200,
		}))
	}

	return new Promise((resolve, reject) => {
		async function process() {
			try {

				let response = new Response();
				response.headers.append('content-type','text/html; charset=utf-8')



				const urlPath = GetUrlPath(req.url);
				const context = makeSwiftContext(req, urlPath, params, response);


				const entryServerHandler: any = webApp
					.LoadedEntryModuleMap[
						entryServerEntrySource!.shardPath
					].default;
				const routerServerHandler: any = webApp
					.LoadedEntryModuleMap[
						routerServerEntrySource!.shardPath
					].default;


				/**
				 * _init.server.tsx 파일이 존재 한다면 먼저 처리 한다.
				 */
				if( webApp.Manifest.initServerShardPath ){
					const initServerScript: any = webApp
						.LoadedEntryModuleMap[
							webApp.Manifest.initServerShardPath
						].default;

					let ret : boolean = await initServerScript(context)
					if( !ret ){
						resolve(
							new Response("error", {
								status: 404,
								headers: response.headers
							}),
						);
					}
				}

				function getRouteModule(pattern: string): any {
					console.log("getRouteModule", pattern, webApp.LoadedEntryModuleMap )

					return webApp
						.LoadedEntryModuleMap[
							webApp.Manifest
								.entries[
									webApp.Manifest.routeNodes[pattern]
										.entryPath ?? "??"
								].shardPath
						].default;
				}

				function requireFunction(shardPath: string): any {
					return webApp.LoadedEntryModuleMap[shardPath].default;
				}

				// console.log()



				/**
				 * 라우트 노드별 serverFetches 를 실행 하여  데이터를 각각 로딩
				 */
				const fetchedDataList: {
					routerPattern: string;
					result: ServerSideRouteFetchResult | undefined | any;
				}[] | unknown = await Promise.all(
					ascendFlatRouteNodeList.map((routeNode) => {
						return new Promise(async (resolve, reject) => {
							resolve(
								await FetchingServerSideRouteData(
									routeNode,
									webApp,
									context,
								),
							);
						});
					}),
				);


				console.log('fetchedDataList',fetchedDataList)
				const routeServerFetchesResultMap: {
					[pattern: string]: ServerSideRouteFetchResult | undefined;
				} = {};

				/**
				 * 위에서 로드 한 데이터를 결과 맵에 바인딩 한다
				 */
				// @ts-ignore
				fetchedDataList.forEach((fetchedData) => {
					if (fetchedData) {
						const pattern = fetchedData.routerPattern;
						const result = fetchedData.result;

						routeServerFetchesResultMap[pattern] = result;
					}
				});


				/**
				 * _app.server.tsx 파일이 있다면 해당 파일에 대한 처리
				 */
				const serverSideAppEntryShardInfo = webApp.Manifest.entries['app/routes/_app.server.tsx'];
				if( serverSideAppEntryShardInfo ){
					const appServerSideModule: any = webApp
						.LoadedEntryModuleMap[ serverSideAppEntryShardInfo.shardPath ];
					const appServerFetchFunction = appServerSideModule.serverFetches

					const appServerSideFetchResult = await appServerFetchFunction(context);
					routeServerFetchesResultMap['_app'] = appServerSideFetchResult
				}


				console.log('routeNodeMap',routeNodeMap)

				/**
				 * router.server.tsx 를 실행해 리액트 라우터 컴포넌트 트리를 생성한다
				 */
				const router = await routerServerHandler(
					context,
					routeNodeMap,
					getRouteModule,
				);

				console.log('router',router)
				/**
				 * reverseRouteStem 를 사용해
				 * 모든 라우터가 포함된 라우트 맵이 아닌
				 * 현재 매치된 라우트의 길만 포함 하는 라우트 노드 생성
				 */
				// let browserRouteNodeFragment: BrowserRouteNode | null = null;
				// reverseRouteStem.forEach((node) => {
				// 	if (browserRouteNodeFragment === null) {
				// 		browserRouteNodeFragment = {
				// 			pattern: node.routePattern,
				// 			module: webApp.Manifest.entries[node.entryPath]
				// 				.shardPath,
				// 		};
				// 	} else {
				// 		/**
				// 		 * 배열 요소 인덱스가 올라 갈수록 상위 라우터를 의미 하므로
				// 		 * 현재 browserRouteNodeFragment 저장된 라우터 노드를 하위로 내리고
				// 		 * browserRouteNodeFragment 에 현재 라우터 정보를 입력 한다.
				// 		 */
				// 		browserRouteNodeFragment = {
				// 			pattern: node.routePattern,
				// 			module: webApp.Manifest.entries[node.entryPath]
				// 				.shardPath,
				// 			children: [browserRouteNodeFragment],
				// 		};
				// 	}
				// });

				try {
					/**
					 * 랜덤 바이트 16개를 base64 로 인코딩 해서 nonce 생성
					 */
					const nonce = btoa(GenerateRandomBytes(16));

					/**
					 * entry.server.ts 를 호출 해 페이지 데이터를 생성
					 */
					const result = await entryServerHandler(context, {
						scripts: webApp.OrderedBrowserScriptShards.map(
							(shardPath: string) => {
								return {
									url: '/_/s/' + shardPath +'?v='+ webApp.Manifest.builtVersion,
								};
							},
						),
						styles: webApp.OrderedBrowserStyleShards.map(
							(shardPath: string) => {
								return {
									url: '/_/s/' + shardPath+'?v='+ webApp.Manifest.builtVersion,
								};
							},
						),
						nonce: nonce,
						loaderScriptUrl: '/_/s/loader.js'+'?v='+ webApp.Manifest.builtVersion,
						browserEntryModulePath: webApp.Manifest.browserEntryShardPath,
						customAppModuleShardPath: webApp.Manifest.customizeAppShardPath,
						customDocumentModuleShardPath: webApp.Manifest.customizeServerDocumentShardPath,


						// server side fetched 데이터 맵
						routeServerFetchesResultMap:
							routeServerFetchesResultMap,
						// 오름차순 정렬 라우트 노드 정보
						ascendRouteNodeList: ascendRouteNodeList,

						// 모듈 로드 함수
						requireFunction: requireFunction,
					} as DocumentSheet, router);

					console.log('result',result)

					/**
					 * Response 객체 생성
					 */
					resolve(
						new Response(result, {
							status: 200,
							headers: response.headers
						}),
					);
				} catch (e) {
					console.log('module load error>', e);
				}
			} catch (e) {
				console.log('failed to load base libs', e);
			}
		}

		process();
	});
}
