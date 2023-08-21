import { RuntimeConfig } from "./src/Config.ts"
import { ResolveWebappStructure } from "./src/WebAppStructure.ts"
import { RunSystemServer } from "./src/SystemServer.ts"
import { SwiftServer } from "./src/SwiftServer.ts"
import { join, Command, flagsParse } from "./src/deps.ts"
import { ReadJson } from "./src/jsonReader.ts"
import { LunarJSManifest } from "../lib/Manifest.ts"

const flags = flagsParse(Deno.args, {
  boolean: ["help"],
  string: ["builtDir"],
  default: { builtDir: "./dist" },
})

async function main() {
  const runtimeConfig = ReadJson<RuntimeConfig>(
    join(flags.builtDir, "runtime.json")
  )
  const manifest = ReadJson<LunarJSManifest>(
    join(runtimeConfig.js.distDirectory, "manifest.json")
  )

  // @ts-ignore
  window.process = {
    env: Deno.env.toObject(),
  }

  const webAppStructure = await ResolveWebappStructure(
    manifest,
    runtimeConfig.js.routesRoot
  )

  const cwd = Deno.cwd()

  const swiftServer = new SwiftServer(runtimeConfig, cwd, webAppStructure)
  swiftServer.run()

  RunSystemServer(runtimeConfig, swiftServer)
  console.log("config:>>", runtimeConfig)
}
main()
