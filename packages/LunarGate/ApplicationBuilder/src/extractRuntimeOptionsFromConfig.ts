import { LunarConfig } from '../../lib/lunarConfig';
import {RuntimeOptions} from "../../lib/runtime";

export function extractRuntimeOptionsFromConfig(config: LunarConfig): RuntimeOptions {
  //

    return {
        type: config.runtime.type
    }
}
