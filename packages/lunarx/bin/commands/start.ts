import { spawn } from "child_process"
import { join } from "path"
import { SupportingRuntime } from "~/core/runtime"
import type { LunarServer } from "../../node-runtime"

export default async function Start(options: {
  runtime: SupportingRuntime
  buildDir: string
}) {
  // set defaults
  options.runtime = options.runtime ?? "node"
  options.buildDir = options.buildDir ?? "./dist"

  return new Promise((resolve, reject) => {
    if (options.runtime == "deno") {
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
        resolve(true)
      })
    } else {
      ;(async function () {
        const module = await import(
          join(process.cwd(), options.buildDir, "node-server.js")
        )
        const Lunar = module.LunarServer as typeof LunarServer
        const server = new Lunar({ BuildDir: options.buildDir })
        await server.loadAppManifest([])
        await server.run()

        resolve(true)
      })()
    }
  })
}
