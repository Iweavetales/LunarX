import { Node } from 'https://deno.land/x/router@v2.0.0/mod.js';
import { RenderPage } from './PageRenderer.ts';
import { SwiftServer } from './SwiftServer.ts';
import { resolve , join} from 'https://deno.land/std@0.150.0/path/mod.ts';
import { lookup } from "https://deno.land/x/media_types/mod.ts";
import { IsDevelopment } from './mode.ts';
import {
	BuiltShardInfo,
	RouteNode,
	RouteNodeMap,
} from '../../Manifest.ts';
import { GetUrlPath } from './urlUtils.ts';
import { ArrayClone } from './array.ts';
import {
	FetchingServerSideRouteData,
	ServerSideRouteFetchResult,
} from './FetchServerSideRouteData.ts';
import { makeSwiftContext } from './SSRContext.ts';
import {UniversalRouteNode} from "../../DocumentTypes.ts";

export { Node };

type Params = Map<string, string>;

type RouteEntryNode = {
	children: RouteEntryNode[];
	shardInfo: BuiltShardInfo;
	parent: RouteEntryNode;
};

export function BuildRoutes(manifestRouteNodes: RouteNodeMap): Node {
	const root = new Node();

	// static file routing
	root.add(
		'/static/*',
		async (req: Request, params: Params, swift: SwiftServer) => {
			const urlPath = GetUrlPath(req.url);
			const resolvedPath = resolve(urlPath.replace(/^\/static/,''))

			const filePath = join(swift.cwd,'/static/', resolvedPath);

			let fileSize;
			try {
				let stat = (await Deno.stat(filePath));

				fileSize = stat.size;
			} catch (e) {
				if (e instanceof Deno.errors.NotFound) {
					return new Response(null, { status: 404 });
				}
				return new Response(null, { status: 500 });
			}

			try{
				const body = (await Deno.open(filePath)).readable;

				return new Response(body, {
					headers: {
						"content-length": fileSize.toString(),
						"content-type":lookup(filePath) || "application/octet-stream"
					},
				});
			} catch (e) {
				console.error("error serve static")
			}

		},
	);


	if (IsDevelopment()) {
		root.add(
			'/dev-helper/hmr',
			(req: Request, params: Params, swift: SwiftServer) => {
				//https://deno.land/manual@v1.25.1/runtime/http_server_apis_low_level
				console.log('hmr request', req);
			},
		);
	}

	root.add(
		'/_/s/loader.js',
		async (req: Request, params: Params, swift: SwiftServer) => {
			if (swift.webApp.Manifest.browserModuleLoaderFilePath) {
				const scriptFile = await Deno.open(
					swift.getDistFilePath(
						swift.webApp.Manifest.browserModuleLoaderFilePath,
					),
					{
						read: true,
					},
				);

				if (scriptFile) {
					return new Response(scriptFile.readable);
				}
			}
			return new Response('', {
				status: 404,
			});
		},
	);

	// source serve
	root.add(
		'/_/s/*',
		async (req: Request, params: Params, swift: SwiftServer) => {
			// console.log(params, params.get('filename'));
			const filename = params.get('filename');
			const urlPath = GetUrlPath(req.url);
			const shardUrl = urlPath.replace(/^\/_\/s\//, '');
			const queryStartIndex = shardUrl.indexOf("?")
			const shardPath = shardUrl.substring(0, queryStartIndex === -1 ? shardUrl.length: queryStartIndex)


			// https://deno.land/manual@v1.25.2/examples/file_server
			const file = await swift.getShardFile(shardPath);
			if (file) {
				return new Response(file.readable);
			}

			return new Response('', {
				status: 404,
			});
		},
	);



	const routePatterns = Object.keys(manifestRouteNodes);
	routePatterns.forEach((routePattern) => {
		const routeNode: RouteNode = manifestRouteNodes[routePattern];
		const terminalToRootOrderedNodeList = [];

		/**
		 * RouteNode 의 upperRoutePattern 을 따라
		 * 상위 라우터를 모은다
		 */
		for (let current = routeNode; current;) {
			terminalToRootOrderedNodeList.push(current);
			if (current.upperRoutePattern) {
				current = manifestRouteNodes[current.upperRoutePattern];
			} else {
				break;
			}
		}
		/**
		 * beginToTerminalRouteStem
		 * 최상위 라우트 부터 최종적으로 매치된 라우트와 그 사이 라우트노드를 포함한 라우트 노드 배열
		 * "/blog/post" 에 매치 되고
		 * "/blog"
		 * "/blog/post"
		 * 라우트가 존재 한다면
		 *
		 * ["/blog", "/blog/post"] 이 순서로 라우트 노드가 들어 있게 됨
		 */
		const ascendFlatRouteNodeList = ArrayClone(
			terminalToRootOrderedNodeList,
		).reverse();

		root.add(
			routePattern,
			async (req: Request, params: Params, swift: SwiftServer) => {
				// req.
				console.log('Enter:', req.url)
				/**
				 * 나중엔 nested 라우트를 지원하기 위해 라우팅 트리 노드를 모아서 배열로 전달
				 */
				const res = await RenderPage(
					swift.cwd,
					swift.webApp,
					req,
					params,
					ascendFlatRouteNodeList,
				);

				return res;
			},
		);

		/**
		 * route 체크 및 SSR 데이터 로드 API
		 */
		root.add(
			'/_/r' + routePattern,
			async (req: Request, params: Params, swift: SwiftServer) => {
				let response = new Response();
				response.headers.append('content-type','application/json')
				// req.
				/**
				 * 나중엔 nested 라우트를 지원하기 위해 라우팅 트리 노드를 모아서 배열로 전달
				 */
				// const res = await RenderPage(swift.cwd, swift.webApp, req, params, ascendFlatRouteNodeList);
				// sid, sidss 체크 하기, sid 가 있어야 응답을 받을 수 있음

				/**
				 * beginToTerminalRouteStem 을 universalNode 배열 로 변환
				 */
				let ascendRouteNodeList: UniversalRouteNode[] = ascendFlatRouteNodeList.map(
					(node) => ({
						// childNodes:[],
						matchPattern: node.routePattern,
						upperRouteMatchPattern: node.upperRoutePattern,
						shardPath: swift.webApp.Manifest.entries[node.entryPath].shardPath,
					}),
				);

				const urlPath = GetUrlPath(req.url).replace(/^\/_\/r/,'' ); // url 패스를 실제 page 패스에 맞추기 위해 앞의 "/_/r" 경로는 제거 한다
				const context = makeSwiftContext(req, urlPath, params);

				/**
				 * _init.server.tsx 파일이 존재 한다면 먼저 처리 한다.
				 */
				if( swift.webApp.Manifest.initServerShardPath ){
					const initServerScript: any =  swift.webApp
						.LoadedEntryModuleMap[
						swift.webApp.Manifest.initServerShardPath
						].default;

					let ret : boolean = await initServerScript(context)
					if( !ret ){
						return new Response("error", {
								status: 404,
								headers: response.headers
							})
					}
				}


				const fetchedDataList: {
					routerPattern: string;
					result: ServerSideRouteFetchResult | undefined;
				}[] = await Promise.all(
					ascendFlatRouteNodeList.map((routeNode) => {
						return new Promise(async (resolve, reject) => {
							resolve(
								await FetchingServerSideRouteData(
									routeNode,
									swift.webApp,
									context,
								),
							);
						});
					}),
				);

				const routeServerFetchesResultMap: {
					[pattern: string]: ServerSideRouteFetchResult | undefined;
				} = {};


				/**
				 * _app.server.tsx 파일이 있다면 해당 파일에 대한 처리
				 */
				const serverSideAppEntryShardInfo = swift.webApp.Manifest.entries['app/routes/_app.server.tsx'];
				if( serverSideAppEntryShardInfo ){
					const appServerSideModule: any = swift.webApp
						.LoadedEntryModuleMap[ serverSideAppEntryShardInfo.shardPath ];
					const appServerFetchFunction = appServerSideModule.serverFetches

					const appServerSideFetchResult = await appServerFetchFunction(context);
					routeServerFetchesResultMap['_app'] = appServerSideFetchResult
				}


				fetchedDataList.forEach((fetchedData) => {
					if (fetchedData) {
						const pattern = fetchedData.routerPattern;
						const result = fetchedData.result;

						routeServerFetchesResultMap[pattern] = result;
					}
				});

				/**
				 * 존재하는 라우트 경로로 정상적인 접근 시도를 했다면
				 * 라우트 SSR 데이터와 라우트 정보를 응답한다.
				 */
				return new Response(
					JSON.stringify({
						data: routeServerFetchesResultMap,
						r:ascendRouteNodeList,
					}),
					{
						status: 200,
						headers: response.headers,
					},
				);
			},
		);
	});
	return root;
}
