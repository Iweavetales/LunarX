import { RuntimeConfig } from "./lib/Config"
import { ResolveWebappStructure } from "./lib/WebAppStructure"
import { RunSystemServer } from "./lib/SystemServer"
import { SwiftServer } from "./lib/SwiftServer"
import { ReadJson } from "./lib/jsonReader"
import { LunarJSManifest } from "../lib/manifest"
import { Command } from "commander"
import { join } from "path"

export async function server() {
  const program = new Command()
  program.option(
    "-b, --builtDir",
    "application built directory. ex) ./dist/",
    "./dist"
  )
  program.parse(process.argv)
  const opts = program.opts()

  const runtimeConfig = ReadJson<RuntimeConfig>(
    join(opts.builtDir, "runtime.json")
  )
  const manifest = ReadJson<LunarJSManifest>(
    join(runtimeConfig.js.distDirectory, "manifest.json")
  )

  const webAppStructure = await ResolveWebappStructure(manifest)

  const cwd = process.cwd()

  const swiftServer = new SwiftServer(runtimeConfig, cwd, webAppStructure)
  swiftServer.run()

  console.log("config:>>", runtimeConfig)
}
