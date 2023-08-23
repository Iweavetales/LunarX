import { join } from "path"
import packageJson from "../../package.json"
import { LunarServer } from "../../node-runtime"
export default async function Dev(options: { buildDir: string }) {
  console.log(options, packageJson)

  return new Promise((resolve, reject) => {
    ;(async function () {
      const nodeServerModule = await import(
        join(__dirname, "../", "./node-runtime", "node-server.js")
      )
      const builderModule = await import(
        join(__dirname, "../", "./builder", "./index.js")
      )
      const createBuildContext = builderModule.createBuildContext
      const buildContext = await createBuildContext(() => {
        // built
        console.log("built")
        server.load()
      })
      await buildContext.watch()

      const lunarServer = nodeServerModule.LunarServer as typeof LunarServer
      const server = new lunarServer({ BuildDir: options.buildDir })

      await server.run()

      resolve(true)
    })()
  })
}
