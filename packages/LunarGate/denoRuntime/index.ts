import { LoadConfig } from './lib/Config.ts';
import { ResolveWebappStructure } from './lib/WebAppStructure.ts';
import { RunSystemServer } from './lib/SystemServer.ts';
import { SwiftServer } from './lib/SwiftServer.ts';
import { LoadManifest } from './lib/Manifest.ts';
import { join } from 'https://deno.land/std@0.150.0/path/mod.ts';
import { commandParser } from "./lib/deps";

async function main() {
	var flags = commandParser(Deno.args, {
		distDir: "./dist"
	})
	var distDir  = flags.distDir



	const config = LoadConfig('./swift.yaml');
	const manifest = LoadManifest(
		join(config.js.distDirectory, 'manifest.json'),
	);
	// let meta = LoadMeta(config.js.esmMetaFilePath);
	// let clientSourceMeta = LoadMeta(config.js.cjsMetaFilePath);

	// @ts-ignore
	window.process = {
		env: Deno.env.toObject()
	}
	const nodeEnv = Deno.env.get('NODE_ENV');

	// console.log('NODE_ENV = ', nodeEnv,window.process);

	/**
   ChunkFileMap 세팅
   */
	// 청크 데이터 맵 생성
	// let chunkFileMap: ChunkFileMap = {};
	// let outputEntries = Object.keys(meta.outputs);
	// for (let i = 0; i < outputEntries.length; i++) {
	//   // let outputEntryKey = outputEntries[i]
	//   let chunkFileName = outputEntries[i];
	//   let chunkInfo = meta.outputs[chunkFileName];
	//
	//   chunkFileMap[chunkFileName] = {
	//     Info: chunkInfo,
	//   };
	// }

	const webAppStructure = await ResolveWebappStructure(
		manifest,
		config.js.routesRoot,
	);
	// console.log('webAppStructure', webAppStructure);

	const cwd = Deno.cwd();

	const swiftServer = new SwiftServer(config, cwd, webAppStructure);
	swiftServer.run();
	// RunPublicServer(config, webAppStructure);

	RunSystemServer(config, swiftServer);
	console.log('config:>>', config);
}
main();
