import {RuntimeConfig} from './lib/Config.ts';
import { ResolveWebappStructure } from './lib/WebAppStructure.ts';
import { RunSystemServer } from './lib/SystemServer.ts';
import { SwiftServer } from './lib/SwiftServer.ts';
import {join, Command, flagsParse} from "./lib/deps.ts";
import {ReadJson} from "./lib/jsonReader.ts";
import {LunarJSManifest} from "../lib/Manifest.ts";

const flags = flagsParse(Deno.args, {
	boolean: ["help"],
	string: ["builtDir"],
	default: { builtDir: "./dist" },
});

async function main() {

 
	const runtimeConfig = ReadJson<RuntimeConfig>(
		join(flags.builtDir , 'runtime.json'),
	);
	const manifest = ReadJson<LunarJSManifest>(
		join(runtimeConfig.js.distDirectory, 'manifest.json'),
	);

	// @ts-ignore
	window.process = {
		env: Deno.env.toObject()
	}

	const webAppStructure = await ResolveWebappStructure(
		manifest,
			runtimeConfig.js.routesRoot,
	);

	const cwd = Deno.cwd();

	const swiftServer = new SwiftServer(runtimeConfig, cwd, webAppStructure);
	swiftServer.run();

	RunSystemServer(runtimeConfig, swiftServer);
	console.log('config:>>', runtimeConfig);
}
main();
