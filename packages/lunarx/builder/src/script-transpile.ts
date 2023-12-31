import { BabelFileResult, transformSync } from "@babel/core"
import { resolve } from "path"
import { readFileSync } from "fs"
import chalk from "chalk"
import { LunarConfig } from "~/core/lunar-config"

export function TranspileScript(
  script: string,
  filename: string,
  config: LunarConfig
): BabelFileResult {
  const compiled = transformSync(script, {
    // https://npmdoc.github.io/node-npmdoc-babel-core/build/apidoc.html#apidoc.element.babel-core.File.prototype.getModuleName
    moduleId: filename, // amd 모듈로 전환 할 때 모듈명을 부여하기 위해 moduleId 를 지정
    filename: filename,

    presets: [
      [
        "@babel/preset-env",
        {
          targets: {
            browsers: ["last 2 versions"],
            // "node":"node 12.0"
          },
        },
      ],
      "@babel/preset-typescript",
    ],
    minified: config.build.minify,
    sourceMaps: config.build.sourceMap,
  })

  if (compiled) {
    return compiled
  }

  throw new Error(`Failed to transpile script ${filename}`)
}

export function GetBrowserModuleLoaderScript(
  config: LunarConfig
): BabelFileResult {
  // dist/builder 디렉토리 기준
  const scriptPath = resolve(
    __dirname,
    "../scripts/browser-amd-module-loader.js"
  )

  try {
    const file = readFileSync(scriptPath)

    const babelRet = TranspileScript(file.toString(), "serve-loader.ts", config)
    return babelRet
  } catch (e) {
    console.error(
      chalk.redBright(
        "Failed to load browser support scripts [browser-amd-module-serve-loader.ts] :",
        e
      )
    )
    throw e
  }
}
