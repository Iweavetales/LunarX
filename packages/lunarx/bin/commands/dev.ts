import { join } from "path"
import { LunarServer } from "../../node-runtime"
import { ShardPath } from "~/core/manifest"

export default async function Dev(options: { buildDir: string }) {
  return new Promise((resolve, reject) => {
    ;(async function () {
      const nodeServerModule = await import(
        join(__dirname, "../", "./node-runtime", "node-server.js")
      )
      const builderModule = await import(
        join(__dirname, "../", "./builder", "./index.js")
      )
      const createBuildContext = builderModule.createBuildContext
      const buildContext = await createBuildContext(
        (updatedShardPaths: ShardPath[]) => {
          // built
          console.log("built")
          server.loadAppManifest(updatedShardPaths)
        }
      )
      await buildContext.watch()

      const lunarServer = nodeServerModule.LunarServer as typeof LunarServer
      const server = new lunarServer({ BuildDir: options.buildDir })

      await server.run()

      resolve(true)
    })()
  })
}
