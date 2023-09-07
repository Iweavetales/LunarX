import {
	parse as yamlParse,
	parseAll as yamlParseAll,
	stringify as yamlStringify,
} from 'https://deno.land/std@0.82.0/encoding/yaml.ts';
import { crypto } from 'https://deno.land/std@0.105.0/crypto/mod.ts?s=crypto';
import * as uuid from "https://deno.land/std@0.194.0/uuid/mod.ts";
import { serve } from 'https://deno.land/std@0.154.0/http/server.ts';
import {join} from "https://deno.land/std@0.150.0/path/mod.ts";
import { Command  } from 'https://deno.land/x/cmd@v1.2.0/mod.ts'
import {parse} from "https://deno.land/std@0.194.0/flags/mod.ts";
const uuidV5Generate = uuid.v5.generate
export {
	uuidV5Generate,
	yamlParse,
	yamlParseAll,
	yamlStringify,
	join,
	crypto,
	serve as httpServe,
	Command,
	parse as flagsParse
}
