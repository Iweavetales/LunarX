import chalk from "chalk"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs"
import { dirname, join, relative } from "path"
import { obfuscate, ObfuscatorOptions } from "javascript-obfuscator"
import queue from "queue"

import { Metafile, Plugin, PluginBuild } from "esbuild"

import { DetermineServerSideShard } from "./server-side-script"
import { BuildRouteNodeMap } from "./routing"
import { BuiltShardInfo, ShardType, LunarJSManifest } from "../../lib/manifest"
import { GetBrowserModuleLoaderScript } from "./script-transpile"
import { TransformEsModuleToAmd } from "./transform-es-module-to-amd"
import { DiffMetaOutput, DiffStatus } from "./meta-file"

import { CheckBrowserEntrySource } from "./browser-entry"
import { LunarConfig } from "../../lib/lunar-config"
import { TransformEsModuleToCjs } from "./transform-es-module-to-cjs"

type PluginOptions = {
  esmDirectory: string
  cjsDirectory: string
  absoluteCJSMetafilePath: string
  absoluteESMMetafilePath: string
  distDirectoryPath: string
  builtNoticeCallback: () => void
}

// eslint-disable-next-line no-unused-vars
type TranspilePlugin = (config: LunarConfig, options: PluginOptions) => Plugin

const plugin: TranspilePlugin = (config, options) => {
  const q = queue({ results: [] })

  const obfuscateOptions: ObfuscatorOptions = {
    compact: true,
    controlFlowFlattening: false,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: false,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    domainLock: [],
    domainLockRedirectUrl: "about:blank",
    forceTransformStrings: [],
    identifierNamesCache: null,
    identifierNamesGenerator: "hexadecimal",
    identifiersDictionary: [],
    identifiersPrefix: "",
    ignoreRequireImports: false,
    inputFileName: "",
    log: false,
    numbersToExpressions: false,
    optionsPreset: "default",
    renameGlobals: false,
    renameProperties: false,
    renamePropertiesMode: "safe",
    reservedNames: [],
    reservedStrings: [],
    seed: 0,
    selfDefending: false,
    simplify: true,
    sourceMap: false,
    sourceMapBaseUrl: "",
    sourceMapFileName: "",
    sourceMapMode: "separate",
    sourceMapSourcesMode: "sources-content",
    splitStrings: false,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.5,
    stringArrayEncoding: [],
    stringArrayIndexesType: ["hexadecimal-number"],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: "variable",
    stringArrayThreshold: 0.75,
    target: "browser",
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
  }

  return {
    name: "babel",
    setup(build: PluginBuild) {
      // const { filter = /.*/, namespace = '', config = {} } = options;
      let oldMetaFile: Metafile | null = null
      //
      // build.onLoad({ filter: /\.[tj]sx$/ }, async args => {
      //   let code = await fs.promises.readFile(args.path, 'utf8');
      //   let plugins = [
      //     'importMeta',
      //     'topLevelAwait',
      //     'classProperties',
      //     'classPrivateProperties',
      //     'classPrivateMethods',
      //     'jsx',
      //   ];
      //   let loader = 'jsx';
      //   if (args.path.endsWith('.tsx')) {
      //     plugins.push('typescript');
      //     loader = 'tsx';
      //   }
      //   const result = await babel.transformAsync(code, {
      //     babelrc: false,
      //     configFile: false,
      //     ast: false,
      //     root,
      //     filename: args.path,
      //     parserOpts: {
      //       sourceType: 'module',
      //       allowAwaitOutsideFunction: true,
      //       plugins,
      //     },
      //     generatorOpts: {
      //       decoratorsBeforeExport: true,
      //     },
      //     plugins: [styled],
      //     sourceMaps: true,
      //     inputSourceMap: false,
      //   });
      //   return {
      //     contents:
      //       result.code +
      //       `//# sourceMappingURL=data:application/json;base64,` +
      //       Buffer.from(JSON.stringify(result.map)).toString('base64'),
      //     loader,
      //   };
      // });

      /**
       * Client Side 소스 트랜스파일
       * Server Side Script 는 제외 하고 amd 형식으로 트랜스파일 한다
       */
      build.onEnd((result) => {
        q.push(async (cb) => {
          /**
           * Server Runtime 에서 참조되는 메니페스트 데이터
           * 이 데이터의 내용으로 라우트를 생성하고 앱의 스크립트 참조 관계를 반영 한다
           *
           * chunks, clientEntryPoints 의 key 는 프로젝트 root 기준 파일 상대 경로이다
           */
          const serviceServerManifest: LunarJSManifest = {
            entries: {},
            chunks: {},
            browserEntryShardPath: "",
            routeNodes: {},
            browserModuleLoaderFilePath: "",
            builtVersion: Date.now().toString(36),
          }

          if (!result.metafile) {
            return
          }

          const diffResult = DiffMetaOutput(
            oldMetaFile || { outputs: {}, inputs: {} },
            result.metafile
          )

          // dist 디렉토리 생성
          if (!existsSync(options.distDirectoryPath)) {
            mkdirSync(options.distDirectoryPath, { recursive: true })
          }

          const esmMeta = result.metafile
          const outputShardPaths = Object.keys(esmMeta.outputs)
          for (let i = 0; i < outputShardPaths.length; i++) {
            const outputKey = outputShardPaths[i]
            const outputDiffStatus = diffResult[outputKey]

            const outputShardPath = outputShardPaths[i]
            const outputInfo = esmMeta.outputs[outputShardPath]

            // esm meta 기준으로 메니페스트 생성
            // console.log(outputShardPath, options.esmDirectory, relative(options.esmDirectory, outputShardPath));

            /**
             * 빌드된 스크립트의 상대 경로
             *  dist/esm/app/routes/importtest.js -> app\routes\importtest.js
             *  dist/esm/chunk-DV3R2RHN.js -> chunk-DV3R2RHN.js
             *
             *  esm 형식이나 cjs 형식이나 상대경로는 동일 하다
             */
            const outputRelativePath = relative(
              options.esmDirectory,
              outputShardPath
            ) //

            /**
             * 윈도우 파일시스템 경로 구분자 "\" 를 url 과 리눅스 파일시스템 경로 구분자인 "/" 로 치환 한다
             */
            const normalizedRelativePath = outputRelativePath.replace(
              /\\/g,
              "/"
            )

            // map 파일 여부
            const isMapFile = /\.map$/.test(normalizedRelativePath)

            /**
             * map file 이 아니면 분류를 시작합니다
             */
            if (!isMapFile) {
              const entryPoint = outputInfo.entryPoint
              const inputs = outputInfo.inputs

              /**
               * 모듈 타입 분류
               */
              let moduleType: ShardType = "unknown"
              if (/\.js$/.test(outputRelativePath)) {
                moduleType = "javascript"
              } else if (/\.css$/.test(outputRelativePath)) {
                moduleType = "stylesheet"
              } else if (/\.map$/.test(outputRelativePath)) {
                moduleType = "mapFile"
              }

              /**
               * 서버사이드 Shard 분류
               */
              const serverSideShardInfo = DetermineServerSideShard(
                entryPoint || null,
                inputs
              )

              /**
               * esbuild 로 출력된 파일 샤드에 서버사이드 모듈이 일부 포함 된 경우에 해당 할 떄
               */
              if (serverSideShardInfo.isAmbiguousServerSideSource) {
                console.warn(
                  chalk.redBright(
                    "[LunarJS] Note: Will be skipped to transpile for client "
                  ),
                  normalizedRelativePath,
                  chalk.redBright("is ambiguous server side shard.")
                )
              }

              /**
               * ADDED 일때만 트랜스파일 or 카피 를 수행 한다
               */
              if (
                outputDiffStatus &&
                outputDiffStatus.status === DiffStatus.ADDED
              ) {
                console.log(
                  chalk.greenBright(`ADDED ESM shard ${outputShardPath}`)
                )

                const esmSourceMapFile =
                  process.env.NODE_ENV === "production"
                    ? null
                    : readFileSync(outputShardPath + ".map")

                // Transform for node-runtime CJS
                await TransformEsModuleToCjs(
                  outputShardPath,
                  normalizedRelativePath,
                  esmSourceMapFile
                )

                /**
                 * Javascript 파일인지 체크
                 */
                if (moduleType === "javascript") {
                  /**
                   * 클라이언트 스크립트 트랜스파일
                   */
                  if (
                    !serverSideShardInfo.isServerSideShard /* 서버사이드 샤드가 아니면 */
                  ) {
                    // console.log(chalk.blue(`Transpile ESM shard ${outputShardPath}`));

                    const transpiledESMSource = TransformEsModuleToAmd(
                      config.build.cjsTranspiler,
                      outputShardPath,
                      normalizedRelativePath,
                      esmSourceMapFile,
                      config
                    )

                    // console.log('transpiledESMSource', transpiledESMSource);

                    const cjsFileName = outputShardPath.replace(
                      /^dist\/esm/,
                      "dist/client"
                    )
                    const cjsMapFileName = cjsFileName + ".map"

                    const targetDirectory = dirname(cjsFileName)
                    if (!existsSync(targetDirectory)) {
                      mkdirSync(targetDirectory, { recursive: true })
                    }

                    if (transpiledESMSource?.code) {
                      // 트랜스파일된 파일내용을 디스크에 쓴다

                      writeFileSync(
                        cjsFileName,
                        config.build.obfuscate
                          ? obfuscate(
                              transpiledESMSource.code,
                              obfuscateOptions
                            ).getObfuscatedCode()
                          : transpiledESMSource.code
                      )

                      if (transpiledESMSource.map) {
                        // 트랜스파일된 소스맵을 디스크에 쓴다
                        writeFileSync(cjsMapFileName, transpiledESMSource.map)
                      }
                    }
                  } else {
                    // server side shard 라면
                  }
                } else if (moduleType === "stylesheet") {
                  // stylesheet 는 esm to cjs 디렉토리로 복사만 수행
                  // console.log(chalk.blue(`Copy stylesheet shard ${outputShardPath}`));
                  const from = outputShardPath
                  const to = from.replace(/^dist\/esm/, "dist/client/")
                  const targetDirectory = dirname(to)
                  if (!existsSync(targetDirectory)) {
                    mkdirSync(targetDirectory, { recursive: true })
                  }
                  copyFileSync(from, to)

                  // map 파일도 복사
                  if (process.env.NODE_ENV === "development") {
                    const from = outputShardPath + ".map"
                    const to = from.replace(/^dist\/esm/, "dist/client/")

                    copyFileSync(from, to)
                  }
                } else if (moduleType === "unknown") {
                  const from = outputShardPath
                  const to = from.replace(/^dist\/esm/, "dist/client/")
                  copyFileSync(from, to)
                }
              }

              /**
               * manifest 에 항목 추가
               */
              if (entryPoint) {
                // entry point modules

                const entryFilepathTokens = entryPoint.split("/")
                const entryFilename = entryFilepathTokens.pop()

                serviceServerManifest.entries[entryPoint] = {
                  entryPoint: entryPoint, // ex) ... /entry/entry.server.js
                  entryFileName: entryFilename, //ex) entry.server.js
                  entryName: entryFilename!.replace(/\.[a-zA-Z]+$/, ""), //ex) entry.server
                  entryFileRelativeDir: entryFilepathTokens.join("/"),

                  shardPath: normalizedRelativePath,
                  isServerSideShard: serverSideShardInfo.isServerSideShard,
                  isEntry: true,
                  isChunk: false,
                  serverSideOutputPath: outputShardPath,
                  clientSideOutputPath: serverSideShardInfo.isServerSideShard
                    ? undefined
                    : outputShardPath.replace("esm", "client"),
                } as BuiltShardInfo
              } else {
                // chunks

                serviceServerManifest.chunks[outputShardPath] = {
                  shardPath: normalizedRelativePath,
                  isServerSideShard: serverSideShardInfo.isServerSideShard,
                  isEntry: true,
                  isChunk: false,
                  type: moduleType,
                  serverSideOutputPath: outputShardPath,
                  clientSideOutputPath: serverSideShardInfo.isServerSideShard
                    ? undefined
                    : outputShardPath.replace("esm", "client"),
                }
              }
            }
          }

          /**
           * 엔트리 분석
           */
          const entryKeys = Object.keys(serviceServerManifest.entries)
          entryKeys.forEach((key) => {
            const entry = serviceServerManifest.entries[key]
            const entryPoint = entry.entryPoint

            if (entryPoint) {
              if (CheckBrowserEntrySource(entry)) {
                serviceServerManifest.browserEntryShardPath = entry.shardPath
              } else if (/routes\/_app\.tsx$/.test(entryPoint)) {
                serviceServerManifest.customizeAppShardPath = entry.shardPath
              } else if (/routes\/_document\.server\.tsx$/.test(entryPoint)) {
                serviceServerManifest.customizeServerDocumentShardPath =
                  entry.shardPath
              } else if (/routes\/_init\.server\.tsx$/.test(entryPoint)) {
                serviceServerManifest.initServerShardPath = entry.shardPath
              }
            }
          })

          /**
           * 라우트 노드맵 생성
           */
          const routeNodes = BuildRouteNodeMap(serviceServerManifest.entries)
          serviceServerManifest.routeNodes = routeNodes

          // 브라우저 전용 파일 디렉토리 생성
          const browserDirectory = join(options.distDirectoryPath, "client")
          if (!existsSync(browserDirectory)) {
            mkdirSync(browserDirectory, { recursive: true })
          }

          // 추가 스크립트 설치
          const browserModuleLoaderScript = GetBrowserModuleLoaderScript()

          const browserModuleLoaderFilepath = join(
            browserDirectory,
            "loader.js"
          )
          const browserModuleLoaderMapFilepath = join(
            browserDirectory,
            "loader.js.map"
          )

          if (!browserModuleLoaderScript.code) {
            return
          }

          if (process.env.NODE_ENV === "production") {
            writeFileSync(
              browserModuleLoaderFilepath,
              obfuscate(
                browserModuleLoaderScript.code,
                obfuscateOptions
              ).getObfuscatedCode()
            )
            writeFileSync(
              browserModuleLoaderMapFilepath,
              JSON.stringify(browserModuleLoaderScript.map)
            )
          } else {
            writeFileSync(
              browserModuleLoaderFilepath,
              browserModuleLoaderScript.code
            )
            writeFileSync(
              browserModuleLoaderMapFilepath,
              JSON.stringify(browserModuleLoaderScript.map)
            )
          }

          serviceServerManifest.browserModuleLoaderFilePath =
            browserModuleLoaderFilepath.replace(/\/\//g, "/")

          // manifest 쓰기
          writeFileSync(
            join(options.distDirectoryPath, "manifest.json"),
            JSON.stringify(serviceServerManifest)
          )

          {
            /**
             * 쓰레기 파일 정리
             */

            // let deletedOutputKeys = Object.keys(diffResult).filter(
            //   outputKey => diffResult[outputKey].status === DiffStatus.DELETED,
            // );
            //
            // for (let i = 0; i < deletedOutputKeys.length; i++) {
            //   // 삭제된 output 파일 esm 과 cjs 에서 제거
            //   //
            //   let deletedOutputKey = deletedOutputKeys[i];
            //   let outputRelativePath = relative(options.esmDirectory, deletedOutputKey); //
            //
            //   console.log(chalk.dim.yellow(`DELETED Old shard ${outputRelativePath}`));
            //   try {
            //     rmSync(join(options.esmDirectory, outputRelativePath));
            //     rmSync(join(options.cjsDirectory, outputRelativePath));
            //   } catch (e) {
            //     console.error(e);
            //   }
            // }

            oldMetaFile = result.metafile
          }

          // // runtime server 에 update 통지
          // if (options.runtimeServerPort) {
          //   try {
          //     await fetch(`http://127.0.0.1:${options.runtimeServerPort}/app-builder/meta/updated`, {
          //       method: 'GET',
          //     });
          //     console.log('Send a notice to the Runtime server that the app has been updated');
          //   } catch (e) {
          //     console.error('Failed to send built notice to Runtime server : ', e);
          //   }
          // }

          if (cb) {
            cb(undefined, `Built sources`)
          } else {
            console.error("cb is undefined")
          }

          /**
           * Meta 쓰기
           */
          writeFileSync(
            options.absoluteESMMetafilePath,
            JSON.stringify(result.metafile)
          )

          // 빌드 완료 통지
          options.builtNoticeCallback()
        })
        q.start((err) => {
          if (err) {
            console.log(chalk.red("BUILD FATAL ERROR"))
            console.error(err)
            throw err
          }
        })
      })
      // build.onResolve({ filter: /\.js$/ }, result => {
      //   console.log('build onResolve', result);
      //   return null;
      // });
      // build.onLoad({ filter, namespace }, async args => {
      //   console.log('onload', args)
      // });
      //
      // if (transform) return transformContents(transform);
      //
      // build.onLoad({ filter, namespace }, async args => {
      //   const contents = await fs.promises.readFile(args.path, 'utf8');
      //
      //   return transformContents({ args, contents });
      // });
    },
  }
}

export default plugin