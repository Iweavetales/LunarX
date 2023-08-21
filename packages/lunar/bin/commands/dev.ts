import { spawn } from "child_process"
import { join } from "path"

export default async function Dev(options: {}) {
  console.log(options)

  const createBuildContext =
    require("../../dist/ApplicationBuilder/index").createBuildContext
  const buildContext = await createBuildContext(() => {
    // built
    console.log("built")
  })

  return Promise.all([
    async (resolve: () => void, _: any) => {
      await buildContext.watch()
      resolve()
    },
    async (resolve: () => void) => {
      const server = spawn("deno", [
        "run",

        "--allow-all",
        join(process.cwd(), options.buildDir, "deno-server.js"),
      ])

      server.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`)
      })

      server.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`)
      })

      server.on("close", (code) => {
        console.log(`child process exited with code ${code}`)
        resolve()
      })
    },
  ])

  console.log(buildContext)
}
