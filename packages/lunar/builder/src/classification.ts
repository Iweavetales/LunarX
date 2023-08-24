import { ShardSourceType } from "../../lib/manifest"

export const REF_PATTERNS = {
  MAP_FILE: /\.map$/,
  JS_FILE: /\.js$/,
  CSS_FILE: /\.css$/,
}

export const checkMapFile = (path: string) => REF_PATTERNS.MAP_FILE.test(path)

export const determineModuleType = (path: string): ShardSourceType => {
  if (REF_PATTERNS.JS_FILE.test(path)) return "javascript"
  if (REF_PATTERNS.CSS_FILE.test(path)) return "stylesheet"
  if (REF_PATTERNS.MAP_FILE.test(path)) return "mapFile"
  return "unknown"
}
