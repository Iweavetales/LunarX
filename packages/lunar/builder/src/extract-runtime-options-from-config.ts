import { LunarConfig } from "../../lib/lunar-config"
import { RuntimeOptions } from "../../lib/runtime"

export function extractRuntimeOptionsFromConfig(
  config: LunarConfig
): RuntimeOptions {
  //

  return {
    js: config.js,
    type: config.runtime.type,
  }
}
