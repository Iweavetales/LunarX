import { ClearDirectory } from "./clearDirectory"
import {
  BuildOptions,
  context as esbuildContext,
  build as esbuildBuild,
} from "esbuild"
import { join, relative, resolve } from "path"
import { existsSync, mkdirSync, writeFileSync } from "fs"

import { getAllFiles } from "./files"
import { defaultConfig, LunarConfig } from "../../lib/lunarConfig"
import esbuildBabelPlugin from "./esbuild-babel-plugin"
import merge from "lodash/merge"
import { collectDistLibSources } from "./collectDistLibSources"
import { extractRuntimeOptionsFromConfig } from "./extractRuntimeOptionsFromConfig"
import { RuntimeOptions } from "../../lib/runtime"

type BuiltCallback = (runtimeOptions: RuntimeOptions) => void

async function CreateBuildOptions(
  builtCallback: BuiltCallback
): Promise<BuildOptions> {
  const cwd = process.cwd()

  let config: LunarConfig = defaultConfig
  const userConfigPath = join(cwd, "lunar.conf.js")
  try {
    const userConfig = await import(userConfigPath)
    config = merge(config, userConfig.default)
    console.log("found user config", userConfig.default)
  } catch (e) {
    // Nothing to do
    console.log("Not exists user config")
  }

  ClearDirectory(config.js.distDirectory)

  const appDirectory = join(cwd, "./app")
  const absoluteESMDistDirectory = join(cwd, config.js.esmDirectory)
  const absoluteCJSDistDirectory = join(cwd, config.js.cjsDirectory)
  const absoluteESMMetafilePath = join(cwd, config.js.esmMetaFilePath)
  const absoluteCJSMetafilePath = join(cwd, config.js.cjsMetaFilePath)
  const routeDirectory = join(appDirectory, "./routes")

  // Lunar Library directory
  const libDirectory = resolve(__dirname, "../../dist/lib") // swift-nest-platform 라이브러리 디렉토리

  if (!existsSync(absoluteESMDistDirectory)) {
    mkdirSync(absoluteESMDistDirectory, {
      recursive: true,
    })
  }

  if (!existsSync(absoluteCJSDistDirectory)) {
    mkdirSync(absoluteCJSDistDirectory, {
      recursive: true,
    })
  }

  /**
   * Make route file list
   */
  const dirtyRouteFiles: any = [] // 필터링 되지않은(dirty) 모든 라우트 디렉토리 내의 파일들
  getAllFiles(routeDirectory, dirtyRouteFiles)
  /**
   * 라우트 디렉토리의 .tsx 확장자를 가진 파일만 필터링 한다
   */
  const filteredRouteFiles = dirtyRouteFiles
    .filter((filename: string) => /\.tsx/.test(filename))
    .map((filename: string) => relative(cwd, filename))

  const libSources = collectDistLibSources(libDirectory)

  /**
   * lightningcss 모듈의
   * if (process.env.CSS_TRANSFORMER_WASM  ) {
   *   module.exports = require(`../pkg`);
   * }
   * cssModulesPlugin 에러를 방지 하기 위해 process.env.CSS_TRANSFORMER_WASM 를 빈값으로 설정
   */
  // process.env.CSS_TRANSFORMER_WASM = '';
  console.log("process.env", process.env)
  const esbuildOptions: BuildOptions = {
    entryPoints: [
      ...libSources,
      ...filteredRouteFiles,
      // 'react',
      // 'react-dom',
      // 'react-dom/server',
      // 'react-router-dom/server',
      ...(config.build.vendors ?? []),
    ],

    /**
     * React JSX 파일의 React 전역 참조를 해결
     */
    // inject: [join(libDirectory, 'react-shim.js')],
    // entryPoints: {
    //   react: 'react',
    //   'react-dom': 'react-dom',
    //   'react-dom-server': 'react-dom/server',
    //   'react-router-dom-server': 'react-router-dom/server',
    //
    //   'styled-components': 'styled-components',
    // },
    // jsx: 'transform',
    // jsxFactory: 'h',
    minify: process.env.NODE_ENV === "production" ? true : false,
    entryNames:
      process.env.NODE_ENV === "production" ? "[hash]" : "[dir]/[name]-[hash]",
    chunkNames:
      process.env.NODE_ENV === "production" ? "[hash]" : "[name]-[hash]",
    // minifySyntax: true,
    sourcemap: process.env.NODE_ENV === "production" ? false : true,
    bundle: true,
    outdir: absoluteESMDistDirectory,
    format: "esm",
    target: [],
    // outExtension: { '.js': '.mjs' }, // esm 모듈은 mjs 로
    splitting: true,
    // external:["react","react-dom"],
    // watch: true,
    // incremental: true,
    metafile: true,
    // write: false,
    treeShaking: true,
    // watch: true,
    loader: {
      ".ttf": "file",
      ".woff2": "file",
      ".woff": "file",
      ".otf": "file",
      ".eot": "file",
      ...config.build.loaders,
    },
    plugins: [
      ...(config.build.plugins ?? []),
      esbuildBabelPlugin(config, {
        distDirectoryPath: config.js.distDirectory,
        cjsDirectory: config.js.cjsDirectory,
        esmDirectory: config.js.esmDirectory,
        absoluteCJSMetafilePath: absoluteCJSMetafilePath,
        absoluteESMMetafilePath: absoluteESMMetafilePath,
        builtNoticeCallback: () => {
          const runtimeOptions = extractRuntimeOptionsFromConfig(config)
          // write runtime options json file to outDir
          writeFileSync(
            join(config.build.outDir, "runtime.json"),
            JSON.stringify(runtimeOptions)
          )

          builtCallback && builtCallback(runtimeOptions)
        },
      }),
    ],
  }
  return esbuildOptions
}

export async function createBuildContext(builtCallback: BuiltCallback) {
  return await esbuildContext(await CreateBuildOptions(builtCallback))
}

export async function build(builtCallback: BuiltCallback) {
  return await esbuildBuild(await CreateBuildOptions(builtCallback))
}
// (async function main() {
//   console.log('ENV =', process.env.NODE_ENV);
//
//   console.log(appDirectory, absoluteESMDistDirectory);
//   let buildContext = await BuildReusableBuilder();
//   console.log('watching');
//   await buildContext.watch();
// })();
