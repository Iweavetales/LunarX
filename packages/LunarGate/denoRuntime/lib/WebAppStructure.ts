import { OutputChunkInfo } from './Meta.ts';

import { BuiltShardInfo, LunarJSManifest } from '../../lib/Manifest.ts';
import { LoadBuiltShardEntryModule } from './moduleLoader.ts';

export type RoutableEntryPointName = string;

export interface WebAppStructure {
	/**
   라우팅 상관없이 엔트리 포인트로 지정된 모듈 목록
   map[엔트리포인트 값]엔트리청크정보
   */
	// ModuleEntries: { [key: string]: EntryPointInfo };

	// ChunkFileMap: ChunkFileMap;

	Manifest: LunarJSManifest;
	LoadedEntryModuleMap: { [shardPath: string]: any };

	/**
	 * 클라이언트에 전달될 소스 파일 맵
	 */
	BrowserShards: {
		// source 의 파일명과 해당 소스파일에 해당하는 경로
		[ShardPath: string]: {
			ShardPath: string;
			IsChunk: boolean; // chunk 가 아니면 entry
			RealPath: string;
		};
	};

	/**
	 * 순서 있는 샤드 배열
	 */
	OrderedBrowserScriptShards: string[];
	OrderedBrowserStyleShards: string[];

	Lib: {
		/**
		 * 플랫폼 연동 라이브러리
		 */
		LunarJSPlatformLibEntries: {
			entryServer?: BuiltShardInfo; // @app/lib/entry.server.tsx
			head?: BuiltShardInfo; // @app/lib/entry.server.tsx
		};

		ReactLibEntries: {
			react?: BuiltShardInfo; // react
			reactDom?: BuiltShardInfo; // react-dom
			reactDomServer?: BuiltShardInfo; // react-dom/server
			reactRouter?: BuiltShardInfo; // react-router
			reactRouterDomServer?: BuiltShardInfo; // react-router-dom/server
		};

		ThirdPartyLibEntries: {
			styledComponents?: BuiltShardInfo; // styled-components
		};
	};
}

// class WebApp implements WebAppStructure {}

const LibEntryFinder = {
	react: /^node_modules\/react\/index\.js/,
	reactDom: /^node_modules\/react-dom\/index\.js/,
	reactDomServer: /^node_modules\/react-dom\/server/,
	reactRouterDomServer: /^node_modules\/react-router-dom\/server/,

	LunarJSPlatformEntryServer: /^app\/lib\/entry.server\.tsx/,
	LunarJSPlatformHead: /^app\/lib\/head\.tsx/,
};

/**
 * Check this SourceFile can be exposed client
 * 클라이언트에서 동작 할 소스코드가
 * WebAppStructure.ClientSourceFileMap 에 등록 될 때
 * 해당 소스파일이 클라이언트에 노출 되어도 괜찮은지를 체크 하는 함수
 * ex) app/lib/entry.server.tsx 파일은 서버사이드 랜더링에만 사용 되고,
 *     감춰진 API 를 호출 할 수도 있기 때문에 클라이언트에 노출 되어선 안된다.
 *
 * 됐고  서버사이드 스크립트 필터임
 * @param outputFileName
 * @param chunkInfo
 * @constructor
 */
function CheckThisSourceFileCanBeExposedClient(
	outputFileName: string,
	chunkInfo: OutputChunkInfo,
) {
	// let originFilename= chunkInfo.Server
	console.log('check source', outputFileName, chunkInfo);
}
// app/lib/head.tsx
// CollectEntries /**
// HTTP 라우팅이 가능한 엔트리 목록을 추출
// relativeRoutesRoot : App Root 베이스의 routesRoot 상대경로
// ex) relativeRoutesRoot == "./app/routes"
export async function ResolveWebappStructure(
	manifest: LunarJSManifest,
	// meta: SourceMetaDescription,
	// clientSourceMeta: SourceMetaDescription,
	relativeRoutesRoot: string,
): Promise<WebAppStructure> {
	const webapp: WebAppStructure = {
		Manifest: manifest,
		LoadedEntryModuleMap: {},
		BrowserShards: {},
		OrderedBrowserScriptShards: [],
		OrderedBrowserStyleShards: [],
		// ModuleEntries: {},
		// Meta: meta,
		// ClientSourceMeta: clientSourceMeta,
		Lib: {
			ReactLibEntries: {},
			LunarJSPlatformLibEntries: {},
			ThirdPartyLibEntries: {},
		},
	};

	const entryKeys = Object.keys(manifest.entries);

	/**
	 * 엔트리 프래그먼트
	 */
	for (let i = 0; i < entryKeys.length; i++) {
		const entryPath = entryKeys[i];
		const entry: BuiltShardInfo = manifest.entries[entryPath];

		// let outputFileName = outputFiles[i];
		// let chunkInfo = meta.outputs[outputFileName];
		const entryPoint = entryPath;

		//
		if (entryPoint) {
			// console.log('entryPoint:', chunkInfo.entryPoint, relative(relativeRoutesRoot, chunkInfo.entryPoint));
			// /**
			//  모든 엔트리 청크를 ModuleEntries 에 등록
			//  */
			// webapp.ModuleEntries[entryPoint] = {
			//   EntryPoint: entryPoint,
			//   ChunkName: outputFileName, // 엔트리포인트에 해당하는 chunk 파일 경로
			//   ChunkInfo: chunkInfo,
			// };

			/**
			 * 서버에서 지정으로 사용하는 라이브러리 엔트리를 모아서 분류한다
			 */
			if (LibEntryFinder.react.test(entryPoint)) {
				// react
				webapp.Lib.ReactLibEntries.react = entry;
			} else if (LibEntryFinder.reactDom.test(entryPoint)) {
				// react-dom
				webapp.Lib.ReactLibEntries.reactDom = entry;
			} else if (LibEntryFinder.reactDomServer.test(entryPoint)) {
				// react-dom/server
				webapp.Lib.ReactLibEntries.reactDomServer = entry;
			} else if (LibEntryFinder.reactRouterDomServer.test(entryPoint)) {
				// react-router-dom/server
				webapp.Lib.ReactLibEntries.reactRouterDomServer = entry;
			} else if (
				LibEntryFinder.LunarJSPlatformEntryServer.test(entryPoint)
			) {
				// app/lib/server
				webapp.Lib.LunarJSPlatformLibEntries.entryServer = entry;
			} else if (LibEntryFinder.LunarJSPlatformHead.test(entryPoint)) {
				// app/lib/server
				webapp.Lib.LunarJSPlatformLibEntries.head = entry;
			}
		} else {
			//
		}
	}

	/**
	 * 모든 Entry 에 해당하는 모듈을 로드
	 */

	const loadedModules = await Promise.all(entryKeys.map(async (key, idx) => {
		const entry = manifest.entries[key];

		return {
			key: entry.shardPath,
			module: await LoadBuiltShardEntryModule(entry.shardPath),
		};
	}));

	const loadedModuleMap = loadedModules.reduce((acc, cur) => {
		return {
			...acc,
			[cur.key]: cur.module,
		};
	}, {});

	{
		const entryKeys = Object.keys(manifest.entries);
		const chunkKeys = Object.keys(manifest.chunks);

		chunkKeys.forEach((chunkKey) => {
			const chunk = manifest.chunks[chunkKey];
			if (chunk.isServerSideShard) {
				return;
			}

			webapp.BrowserShards[chunk.shardPath] = {
				ShardPath: chunk.shardPath,
				RealPath: chunk.clientSideOutputPath ?? "??",
				IsChunk: false,
			};

			if (/\.css$/.test(chunk.shardPath)) {
				webapp.OrderedBrowserStyleShards.push(chunk.shardPath);
			} else if (/\.js$/.test(chunk.shardPath)) {
				webapp.OrderedBrowserScriptShards.push(chunk.shardPath);
			}
		});

		entryKeys.forEach((entryKey) => {
			const entry = manifest.entries[entryKey];
			if (entry.isServerSideShard) {
				return;
			}

			webapp.BrowserShards[entry.shardPath] = {
				ShardPath: entry.shardPath,
				RealPath: entry.clientSideOutputPath ?? "??",
				IsChunk: false,
			};

			if (/\.css$/.test(entry.shardPath)) {
				webapp.OrderedBrowserStyleShards.push(entry.shardPath);
			} else if (/\.js$/.test(entry.shardPath)) {
				webapp.OrderedBrowserScriptShards.push(entry.shardPath);
			}
		});
	}

	webapp.LoadedEntryModuleMap = loadedModuleMap;

	return webapp;
}
