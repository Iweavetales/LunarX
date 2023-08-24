import { transformFileSync as swcTransformFileSync } from "@swc/core"
import { dirname } from "path"
import { existsSync, mkdirSync, writeFileSync } from "fs"

export async function TransformEsModuleToCjs(
  outputShardPath: string,
  normalizedRelativePath: string,
  esmSourceMapFile: Buffer | null
) {
  const result = await swcTransformFileSync(outputShardPath, {
    module: {
      type: "commonjs",
    },
    isModule: true,
    filename: normalizedRelativePath,
    sourceMaps: process.env.NODE_ENV === "production" ? false : true,
    inputSourceMap:
      process.env.NODE_ENV === "production"
        ? false
        : (esmSourceMapFile || "{}").toString(),
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
  }
}
