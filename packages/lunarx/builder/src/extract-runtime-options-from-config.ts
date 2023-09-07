import { LunarConfig } from "~/core/lunar-config"
import { RuntimeOptions } from "~/core/runtime"

export function extractRuntimeOptionsFromConfig(
  config: LunarConfig
): RuntimeOptions {
  //

  return {
    js: config.js,
    type: config.runtime.type,
  }
}
