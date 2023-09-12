import { transformFileSync as swcTransformFileSync } from "@swc/core"
import { dirname } from "path"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { LunarConfig } from "~/core/lunar-config"

export async function TransformEsModuleToCjs(
  outputShardPath: string,
  normalizedRelativePath: string,
  esmSourceMapFile: Buffer | null,
  config: LunarConfig
) {
  const result = await swcTransformFileSync(outputShardPath, {
    module: {
      type: "commonjs",
    },
    isModule: true,
    filename: normalizedRelativePath,
    sourceMaps: config.build.sourceMap,

    inputSourceMap: config.build.sourceMap
      ? (esmSourceMapFile || "{}").toString()
      : false,
  })

  const cjsFileName = outputShardPath.replace(/^dist\/esm/, "dist/cjs")
  const cjsMapFileName = cjsFileName + ".map"

  const targetDirectory = dirname(cjsFileName)
  if (!existsSync(targetDirectory)) {
    mkdirSync(targetDirectory, { recursive: true })
  }

  if (result?.code) {
    // 트랜스파일된 파일내용을 디스크에 쓴다

    writeFileSync(cjsFileName, result.code)

    if (result.map) {
      // 트랜스파일된 소스맵을 디스크에 쓴다
      writeFileSync(cjsMapFileName, result.map)
    }
  }

  return {
    size: result.code.length,
    name: cjsFileName,
    mapData: result.map,
    codeData: result.code,
  }
}
