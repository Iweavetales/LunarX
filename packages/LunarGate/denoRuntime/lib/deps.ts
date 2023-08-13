import {
	parse as yamlParse,
	parseAll as yamlParseAll,
	stringify as yamlStringify,
} from 'https://deno.land/std@0.82.0/encoding/yaml.ts';

import * as uuid from "https://deno.land/std@0.194.0/uuid/mod.ts";
const uuidV4 = uuid.v4.generate
export { uuidV4, yamlParse, yamlParseAll, yamlStringify };
