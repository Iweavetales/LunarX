import { yamlParse } from './deps.ts';
// https://deno.land/manual@v1.25.1/standard_library
// https://deno.land/std@0.154.0/encoding/yaml.ts

export type RuntimeConfig = {
	js: {
		distDirectory: string;
		esmDirectory: string;
		cjsDirectory: string;
		esmMetaFilePath: string;
		cjsMetaFilePath: string;
		routesRoot: string;
	};
};

