import {
  BuiltShardInfo,
  LunarJSManifest,
  ShardSourceType,
  ShardPath,
  DedicatedEntryName,
  DedicatedEntryPath,
} from "~/core/manifest"
import { Metafile } from "esbuild"
import { DiffMetaOutput, DiffResult, DiffStatus } from "./meta-file"
import { dirname, join, relative } from "path"
import {
  DetermineServerSideShard,
  ResultOfDetermineServerSideShard,
} from "./server-side-script"
import chalk from "chalk"
import { copyFileSync, readFileSync, writeFileSync } from "fs"
import { TransformEsModuleToCjs } from "./transform-es-module-to-cjs"
import { TransformEsModuleToAmd } from "./transform-es-module-to-amd"
import { obfuscate } from "javascript-obfuscator"
import { defaultObfuscateOptions } from "./obfuscator"
import { normalizePath } from "./path"
import { checkMapFile, determineModuleType } from "./classification"
import { LunarConfig } from "~/core/lunar-config"
import { CheckBrowserEntrySource } from "./browser-entry"
import { BuildRouteNodeMap } from "./routing"
import { GetBrowserModuleLoaderScript } from "./script-transpile"
import { ensureDirectoryExists } from "./directory"
import { removeCurrentDirPathToken } from "./misc/remove-current-dir-path-token"
import { match } from "./enhanced-switch"
import { removeLastExtensionOfFilename } from "./misc/remove-last-extension-of-filename"

enum ModuleType {
  CommonJS,
  AMD,
  ESM,
}

type ProcessResultRecordsMap = {
  [shardPath: ShardPath]: ProcessResultRecord[]
}
type ProcessResultRecord = {
  moduleType?: ModuleType
  resultSize: number
  codeData?: string
  mapData?: string
  data?: Buffer
}

export type ProcessingOptions = {
  esmDirectory: string
  cjsDirectory: string
  absoluteCJSMetafilePath: string
  absoluteESMMetafilePath: string
  distDirectoryPath: string
  builtNoticeCallback: (updatedShardPaths: string[]) => void
}
type MetafileOutputKey = keyof Metafile["outputs"]
type MetafileOutputInfo = Metafile["outputs"][MetafileOutputKey]

export class PostProcessor {
  manifest!: LunarJSManifest
  oldMeta: Metafile
  options: ProcessingOptions
  config: LunarConfig

  constructor(config: LunarConfig, options: ProcessingOptions) {
    this.oldMeta = { inputs: {}, outputs: {} }
    this.initManifest()
    this.options = options
    this.config = config
  }

  initManifest() {
    this.manifest = {
      entries: {},
      chunks: {},
      entryDictionaryByDedicatedEntryName: {},
      browserEntryShardPath: "",
      routeInfoNodes: {},
      browserModuleLoaderFilePath: "",
      builtVersion: Date.now().toString(36),
    }
  }

  warnIfAmbiguousServerSideShard(
    ssShardResult: ResultOfDetermineServerSideShard,
    path: string
  ) {
    if (ssShardResult.isAmbiguousServerSideSource) {
      console.warn(
        chalk.redBright(
          "[LunarX] Note: Will be skipped to transpile for client"
        ),
        path,
        chalk.redBright("is ambiguous server side shard.")
      )
    }
  }

  private async processStylesheet(
    outputPath: string
  ): Promise<ProcessResultRecord[]> {
    const processResultRecords: ProcessResultRecord[] = []

    // stylesheet 는 esm to cjs 디렉토리로 복사만 수행
    // console.log(chalk.blue(`Copy stylesheet shard ${outputPath}`));
    const from = outputPath
    const to = from.replace(/^dist\/esm/, "dist/client/")
    const targetDirectory = dirname(to)

    ensureDirectoryExists(targetDirectory)
    copyFileSync(from, to)

    // map 파일도 복사
    if (process.env.NODE_ENV === "development") {
      const from = outputPath + ".map"
      const to = from.replace(/^dist\/esm/, "dist/client/")

      copyFileSync(from, to)
    }

    return processResultRecords
  }

  private async processCopyAsPublic(
    outputPath: string
  ): Promise<ProcessResultRecord[]> {
    const processResultRecords: ProcessResultRecord[] = []

    const from = outputPath
    const to = from.replace(/^dist\/esm/, "dist/client/")
    copyFileSync(from, to)

    return processResultRecords
  }

  private async processJavascript(
    outputPath: string,
    normalizedRelativePath: string,
    esmSourceMapFile: Buffer | null,
    serverSideShardInfo: ResultOfDetermineServerSideShard
  ): Promise<ProcessResultRecord[]> {
    const processResultRecord: ProcessResultRecord[] = []
    // Transform for node-runtime CJS whether shard is server-side shard or not
    const {
      size: cjsFileSize,
      codeData,
      mapData,
    } = await TransformEsModuleToCjs(
      outputPath,
      normalizedRelativePath,
      esmSourceMapFile
    )

    processResultRecord.push({
      resultSize: cjsFileSize,
      moduleType: ModuleType.CommonJS,
      codeData: codeData,
      mapData: mapData,
    })

    if (serverSideShardInfo.isServerSideShard === false) {
      /**
       * Transform to AMD for client
       */
      const transpiledESMSource = await TransformEsModuleToAmd(
        this.config.build.cjsTranspiler,
        outputPath,
        normalizedRelativePath,
        esmSourceMapFile,
        this.config
      )

      if (!transpiledESMSource.code) {
        console.error("failed to transform esm to amd", outputPath)
        return processResultRecord
      }

      processResultRecord.push({
        resultSize: transpiledESMSource.code?.length ?? 0,
        moduleType: ModuleType.AMD,
        codeData: transpiledESMSource.code ?? undefined,
        mapData: transpiledESMSource.map,
      })

      const clientFileName = outputPath.replace(/^dist\/esm/, "dist/client")
      const cjsMapFileName = clientFileName + ".map"

      const targetDirectory = dirname(clientFileName)
      ensureDirectoryExists(targetDirectory)

      // 트랜스파일된 파일내용을 디스크에 쓴다

      writeFileSync(
        clientFileName,
        this.config.build.obfuscate
          ? obfuscate(
              transpiledESMSource.code,
              defaultObfuscateOptions
            ).getObfuscatedCode()
          : transpiledESMSource.code
      )

      if (transpiledESMSource.map) {
        // 트랜스파일된 소스맵을 디스크에 쓴다
        writeFileSync(cjsMapFileName, transpiledESMSource.map)
      }
    } else {
      // server side shard 라면
    }

    return processResultRecord
  }

  private async processingOutputs(
    diffResult: DiffResult,
    outputInfo: MetafileOutputInfo,
    outputPath: string
  ): Promise<{
    shardPath: ShardPath
    processResultRecords: ProcessResultRecord[]
  }> {
    /**
     * 빌드된 스크립트의 상대 경로
     *  dist/esm/app/routes/importtest.js -> app\routes\importtest.js
     *  dist/esm/chunk-DV3R2RHN.js -> chunk-DV3R2RHN.js
     *
     *  esm 형식이나 cjs 형식이나 상대경로는 동일 하다
     */
    const outputRelativePath = relative(this.options.esmDirectory, outputPath)

    const normalizedRelativePath: ShardPath = normalizePath(outputRelativePath)

    // map 파일 여부
    const isMapFile = checkMapFile(normalizedRelativePath)
    if (isMapFile) {
      /**
       * There's nothing to do with the .map file because it is processed by each source processor.
       */
      return {
        shardPath: normalizedRelativePath,
        processResultRecords: [],
      }
    }

    const entryPoint = outputInfo.entryPoint
    const inputs = outputInfo.inputs

    /**
     * 모듈 타입 분류
     */
    const moduleType: ShardSourceType = determineModuleType(outputRelativePath)

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
    this.warnIfAmbiguousServerSideShard(
      serverSideShardInfo,
      normalizedRelativePath
    )

    let processResultRecords: ProcessResultRecord[] = []
    /**
     * ADDED 일때만 트랜스파일 or 카피 를 수행 한다
     */
    if (diffResult && diffResult.status === DiffStatus.ADDED) {
      console.log(chalk.greenBright(`ADDED ESM shard ${outputPath}`))

      if (moduleType === "javascript") {
        const esmSourceMapFile =
          process.env.NODE_ENV === "production"
            ? null
            : readFileSync(outputPath + ".map")

        processResultRecords = await this.processJavascript(
          outputPath,
          normalizedRelativePath,
          esmSourceMapFile,
          serverSideShardInfo
        )
      } else if (moduleType === "stylesheet") {
        processResultRecords = await this.processStylesheet(outputPath)
      } else if (moduleType === "unknown") {
        // Copy shard to be accessed by client
        processResultRecords = await this.processCopyAsPublic(outputPath)
      }
    }

    /**
     * manifest 에 항목 추가
     */
    if (entryPoint) {
      // entry point modules

      const entryFilepathTokens = entryPoint.split("/")
      const entryFilename = entryFilepathTokens.pop()

      let dedicatedEntryPath: DedicatedEntryPath = ""
      match(entryPoint)
        .with(
          (value) =>
            value.indexOf(`dist/impl/${this.config.frontFramework}/entry/`),
          (ret) => ret > -1,
          (value, evalResult) => {
            const internalEntryPathBase = value.substring(evalResult)
            const entryTokenIndex = internalEntryPathBase.indexOf("entry/")
            dedicatedEntryPath =
              "@" + internalEntryPathBase.substring(entryTokenIndex)
          }
        )
        .with(
          (value) =>
            value.indexOf(removeCurrentDirPathToken(this.config.js.routesRoot)),
          (ret) => ret > -1,
          (value, evalResult) => {
            const appRouteEntryPathBase = value.substring(evalResult)
            dedicatedEntryPath = appRouteEntryPathBase.substring(
              removeCurrentDirPathToken(this.config.js.routesRoot).length
            )
          }
        )
        .once()

      const dedicatedEntryName: DedicatedEntryName =
        removeLastExtensionOfFilename(dedicatedEntryPath)

      // registry into dictionary
      this.manifest.entryDictionaryByDedicatedEntryName[dedicatedEntryName] =
        entryPoint

      this.manifest.entries[entryPoint] = {
        entryPoint: entryPoint, // ex) ... /entry/entry.server.js
        entryFileName: entryFilename, //ex) entry.server.js
        entryName: removeLastExtensionOfFilename(entryFilename!), //ex) entry.server
        entryFileRelativeDir: entryFilepathTokens.join("/"),
        dedicatedEntryPath: dedicatedEntryPath,
        dedicatedEntryName: dedicatedEntryName,

        shardPath: normalizedRelativePath,
        isServerSideShard: serverSideShardInfo.isServerSideShard,
        isEntry: true,
        isChunk: false,
        serverSideOutputPath: outputPath,
        clientSideOutputPath: serverSideShardInfo.isServerSideShard
          ? undefined
          : outputPath.replace("esm", "client"),
      } as BuiltShardInfo
    } else {
      // chunks

      this.manifest.chunks[outputPath] = {
        shardPath: normalizedRelativePath,
        isServerSideShard: serverSideShardInfo.isServerSideShard,
        isEntry: true,
        isChunk: false,
        type: moduleType,
        serverSideOutputPath: outputPath,
        clientSideOutputPath: serverSideShardInfo.isServerSideShard
          ? undefined
          : outputPath.replace("esm", "client"),

        fileSize: {},
      }
    }

    return { shardPath: normalizedRelativePath, processResultRecords }
  }

  async setupClientLoaderScript() {
    const clientDirectory = join(this.options.distDirectoryPath, "client")
    ensureDirectoryExists(clientDirectory)

    const browserModuleLoaderScript = GetBrowserModuleLoaderScript()

    const browserModuleLoaderFilepath = join(clientDirectory, "loader.js")
    const browserModuleLoaderMapFilepath = join(
      clientDirectory,
      "loader.js.map"
    )

    if (!browserModuleLoaderScript.code) {
      return
    }

    if (process.env.NODE_ENV === "production") {
      writeFileSync(
        browserModuleLoaderFilepath,
        this.config.build.obfuscate
          ? obfuscate(
              browserModuleLoaderScript.code,
              defaultObfuscateOptions
            ).getObfuscatedCode()
          : browserModuleLoaderScript.code
      )
      writeFileSync(
        browserModuleLoaderMapFilepath,
        JSON.stringify(browserModuleLoaderScript.map)
      )
    } else {
      writeFileSync(browserModuleLoaderFilepath, browserModuleLoaderScript.code)
      writeFileSync(
        browserModuleLoaderMapFilepath,
        JSON.stringify(browserModuleLoaderScript.map)
      )
    }

    // set ClientModuleLoader path to manifest
    this.manifest.browserModuleLoaderFilePath =
      browserModuleLoaderFilepath.replace(/\/\//g, "/")
  }

  classifyEntries() {
    const entryKeys = Object.keys(this.manifest.entries)
    entryKeys.forEach((key) => {
      const entry = this.manifest.entries[key]
      const entryPoint = entry.entryPoint

      if (entryPoint) {
        if (CheckBrowserEntrySource(entry)) {
          this.manifest.browserEntryShardPath = entry.shardPath
        } else if (/routes\/_app\.[tj]sx$/.test(entryPoint)) {
          this.manifest.customizeAppShardPath = entry.shardPath
        } else if (/routes\/_404\.[tj]sx$/.test(entryPoint)) {
          this.manifest.customize404ShardPath = entry.shardPath
        } else if (/routes\/_error\.[tj]sx$/.test(entryPoint)) {
          this.manifest.customizeErrorShardPath = entry.shardPath
        } else if (/routes\/_document\.server\.[tj]sx$/.test(entryPoint)) {
          this.manifest.customizeServerDocumentShardPath = entry.shardPath
        } else if (/routes\/_init\.server\.[tj]sx?$/.test(entryPoint)) {
          this.manifest.initServerShardPath = entry.shardPath
        }
      }
    })
  }

  async run(meta: Metafile) {
    this.initManifest()

    const diffResults = DiffMetaOutput(
      this.oldMeta || { outputs: {}, inputs: {} },
      meta
    )

    const outputPaths = Object.keys(meta.outputs)

    const updatedShardPaths: ShardPath[] = []
    /**
     * Processing serial each output shard with Promise
     */
    const processingResults = await Promise.all(
      outputPaths.map(async (outputPath) => {
        const outputDiffStatus = diffResults[outputPath]
        const outputInfo = meta.outputs[outputPath]

        // return ProcessResultRecordsMap
        const result = await this.processingOutputs(
          outputDiffStatus,
          outputInfo,
          outputPath
        )

        if (outputDiffStatus) {
          switch (outputDiffStatus.status) {
            case DiffStatus.ADDED:
            case DiffStatus.MODIFIED:
              updatedShardPaths.push(result.shardPath)
              break
          }
        }
      })
    )

    this.classifyEntries()

    /**
     * Generate route node map
     */
    const routeNodes = BuildRouteNodeMap(this.manifest.entries)
    this.manifest.routeInfoNodes = routeNodes

    // Setup client loader script to dist/client
    await this.setupClientLoaderScript()

    // Write manifest as file for server-runtime
    writeFileSync(
      join(this.options.distDirectoryPath, "manifest.json"),
      JSON.stringify(this.manifest)
    )

    this.oldMeta = meta

    /**
     * Write Meta as file
     */
    writeFileSync(this.options.absoluteESMMetafilePath, JSON.stringify(meta))

    return { updatedShardPaths, manifest: this.manifest }
  }
}
