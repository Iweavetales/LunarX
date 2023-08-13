import { yamlParse } from './deps.ts';
// https://deno.land/manual@v1.25.1/standard_library
// https://deno.land/std@0.154.0/encoding/yaml.ts

export type Config = {
	js: {
		distDirectory: string;
		esmDirectory: string;
		cjsDirectory: string;
		esmMetaFilePath: string;
		cjsMetaFilePath: string;
		routesRoot: string;
	};
	publicServe: {
		port: string;
	};
	privateServe: {
		port: string;
	};
	production: boolean;
};

export function LoadConfig(path: string): Config {
	const text = Deno.readTextFileSync(path);

	const config: Config = yamlParse(text) as Config;

	return config;
}
