import chalk from "chalk"
import queue from "queue"

import { Plugin, PluginBuild } from "esbuild"

import { LunarConfig } from "~/core/lunar-config"
import { PostProcessor, ProcessingOptions } from "./post-processor"
import { ensureDirectoryExists } from "./directory"
// eslint-disable-next-line no-unused-vars
type TranspilePlugin = (
  config: LunarConfig,
  options: ProcessingOptions
) => Plugin

const plugin: TranspilePlugin = (config, options) => {
  const q = queue({ results: [] })
  const postProcessor = new PostProcessor(config, options)

  return {
    name: "transform",
    setup(build: PluginBuild) {
      /**
       * This plugin transform entry, chunks by esbuild to Lunar lifecycle compatible.
       */
      build.onEnd((result) => {
        q.push(async (cb) => {
          ensureDirectoryExists(options.distDirectoryPath)

          if (!result.metafile) {
            return
          }

          const postProcessingResult = await postProcessor.run(result.metafile)

          // Notice finish build at time // 업데이트된 소스, 그리고 해당 소스를 의존중인 소스 모두를 트리 형식으로 데이터를 만들어서 전달 해야 함
          options.builtNoticeCallback(postProcessingResult.updatedShardPaths)
        })
        q.start((err) => {
          if (err) {
            console.log(chalk.red("BUILD FATAL ERROR"))
            console.error(err)
            throw err
          }
        })
      })
    },
  }
}

export default plugin
