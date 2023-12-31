import { ClearDirectory } from "./clear-directory"
import {
  BuildOptions,
  context as esbuildContext,
  build as esbuildBuild,
  Platform,
} from "esbuild"
import { join, relative, resolve } from "path"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { getAllFiles } from "./files"
import { baseConfig, ExtendConfig, LunarConfig } from "~/core/lunar-config"
import appBuilderPlugin from "./app-builder-plugin"
import { collectAllSourcesFromDirectory } from "./collect-all-sources-from-directory"
import { extractRuntimeOptionsFromConfig } from "./extract-runtime-options-from-config"
import { ShardPath } from "~/core/manifest"
import chalk from "chalk"
import { RESERVED_CONFIG_FILE_NAME } from "./constants"

type BuiltCallback = (updatedShardPaths: string[]) => void

async function CreateBuildOptions(
  builtCallback: BuiltCallback,
  buildType: "build" | "dev"
): Promise<BuildOptions> {
  const cwd = process.cwd()

  let config: LunarConfig = baseConfig
  const userConfigPath = join(cwd, RESERVED_CONFIG_FILE_NAME)

  try {
    const userConfig = await import(userConfigPath)
    config = ExtendConfig(config, userConfig.default)
  } catch (e) {
    console.log(chalk.red(`Failed to apply ${RESERVED_CONFIG_FILE_NAME}`))
    throw e
  }

  console.log("Final config", config)
  ClearDirectory(config.js.distDirectory)

  const appDirectory = join(cwd, "./app")
  const absoluteESMDistDirectory = join(cwd, config.js.esmDirectory)
  const absoluteCJSDistDirectory = join(cwd, config.js.cjsDirectory)
  const absoluteESMMetafilePath = join(cwd, config.js.esmMetaFilePath)
  const absoluteCJSMetafilePath = join(cwd, config.js.cjsMetaFilePath)
  const routeDirectory = join(appDirectory, "./routes")

  // front framework implementation entry directory
  const targetFrontFrameworkImplementEntryDirectoryPath = resolve(
    __dirname,
    "../impl/",
    `./${config.frontFramework}`,
    "./entry"
  ) // swift-nest-platform 라이브러리 디렉토리

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
  const rawRouteFiles: any = []
  getAllFiles(routeDirectory, rawRouteFiles)
  /**
   * 라우트 디렉토리의 .tsx|js|ts|jsx 확장자를 가진 파일만 필터링 한다
   */
  const filteredRouteFiles = rawRouteFiles
    .filter((filename: string) => /\.[jt]sx?$/.test(filename))
    .map((filename: string) => relative(cwd, filename))

  const targetFrameworkEntryFiles = collectAllSourcesFromDirectory(
    targetFrontFrameworkImplementEntryDirectoryPath
  )

  const isBuild = buildType === "build"
  /**
   * If process.env.NODE_ENV is not set, `$ lunarx build` will build in `production` mode to prevent deployer mistakes
   */
  const NODE_ENV =
    process.env.NODE_ENV || (isBuild ? "production" : "development")

  const esbuildOptions: BuildOptions = {
    entryPoints: [
      ...targetFrameworkEntryFiles,
      ...filteredRouteFiles,

      ...(config.build.vendors ?? []),
    ],

    /**
     * React JSX 파일의 React 전역 참조를 해결
     */
    // inject: [join(libDirectory, 'react-shim.js')],
    define: {
      DEFINE_DELETE_BOOTSTRAP_BLOCK_AFTER_BOOT: config.etc
        .deleteBootstrapScriptAfterBoot
        ? "true"
        : "false",
      // If the application is in production mode or if the buildType is set to 'build', fast refresh (also known as HMR) will be disabled.
      DEFINE_ENABLE_FAST_REFRESH: NODE_ENV === "production" ? "false" : "true",

      /**
       * Set for avoid crash React-based code at browser
       * refer: https://esbuild.github.io/api/#platform
       */
      "process.env.NODE_ENV": JSON.stringify(NODE_ENV),

      COMPRESSING_SSR_DATA: JSON.stringify(
        config.runtime.compressSSRData ?? false
      ),
    },
    minify: config.build.minify,
    minifyWhitespace: config.build.minify,
    entryNames: NODE_ENV === "production" ? "[hash]" : "[dir]/[name]-[hash]",
    chunkNames: NODE_ENV === "production" ? "[hash]" : "[name]-[hash]",
    // minifySyntax: true,
    sourcemap: config.build.sourceMap,
    bundle: true,
    outdir: absoluteESMDistDirectory,
    platform: ((): Platform => {
      // platform will set depend on runtime target
      switch (config.runtime.target) {
        case "node":
          return "node"
        case "deno":
          return "browser"
        case "bun":
          return "browser"
      }
    })(),
    format: "esm",
    target: ["es6"],
    splitting: true,
    metafile: true,
    treeShaking: true,
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
      appBuilderPlugin(config, {
        distDirectoryPath: config.js.distDirectory,
        cjsDirectory: config.js.cjsDirectory,
        esmDirectory: config.js.esmDirectory,
        absoluteCJSMetafilePath: absoluteCJSMetafilePath,
        absoluteESMMetafilePath: absoluteESMMetafilePath,
        builtNoticeCallback: (updatedShardPaths: ShardPath[]) => {
          const runtimeOptions = extractRuntimeOptionsFromConfig(config)
          // write runtime options json file to outDir
          writeFileSync(
            join(config.build.outDir, "runtime.json"),
            JSON.stringify(runtimeOptions)
          )

          builtCallback && builtCallback(updatedShardPaths)
        },
      }),
    ],
  }
  return esbuildOptions
}

export async function createBuildContext(builtCallback: BuiltCallback) {
  return await esbuildContext(await CreateBuildOptions(builtCallback, "dev"))
}

export async function build(builtCallback: BuiltCallback) {
  return await esbuildBuild(await CreateBuildOptions(builtCallback, "build"))
}
