import { RuntimeConfig } from "./src/config.ts"
import { ResolveWebappStructure } from "./src/web-app-structure.ts"
import { RunSystemServer } from "./src/system-server.ts"
import { LunarServer } from "./src/lunar-server.ts"
import { join, Command, flagsParse } from "./src/deps.ts"
import { ReadJson } from "./src/json-reader.ts"
import { LunarJSManifest } from "../lib/manifest.ts"

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

  const swiftServer = new LunarServer(runtimeConfig, cwd, webAppStructure)
  swiftServer.run()

  RunSystemServer(runtimeConfig, swiftServer)
  console.log("config:>>", runtimeConfig)
}
main()
