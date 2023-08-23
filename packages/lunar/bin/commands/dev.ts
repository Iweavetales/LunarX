import { spawn } from "child_process"
import { join } from "path"
import packageJson from "../../package.json"
export default async function Dev(options: {}) {
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
      })
      await buildContext.watch()

      const server = nodeServerModule.server
      console.log("ss", server)
      await server()

      resolve(true)
    })()
  })
}
