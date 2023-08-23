import { RuntimeConfig } from "./Config"
import { ResolveWebappStructure } from "./WebAppStructure"
import { SwiftServer } from "./SwiftServer"
import { join } from "path"
import express from "express"
import { ReadJson } from "./jsonReader"
import { LunarJSManifest } from "../../lib/manifest"

export function RunSystemServer(
  config: RuntimeConfig,
  swiftServer: SwiftServer
) {
  const app = express()

  /**
   * # Feature Used in development mode
   * 페이지 소스가 변경되면 applicationBuilder 로 부터 notice 를 받고
   * notice 가 도착하면 swiftServer 의 webApp 정보를 업데이트 하여 새로운 소스를 반영 한다
   */
  app.get("/app-builder/meta/updated", async function (req, res) {
    console.log("[System] App-builder meta will updated.")
    const manifest = ReadJson<LunarJSManifest>(
      join(config.js.distDirectory, "manifest.json")
    )

    const webAppStructure = await ResolveWebappStructure(manifest)

    swiftServer.updateWebApp(webAppStructure)
    console.log("[System] App-builder meta updated.")
    res.send("ok")
  })

  // app.listen(config.privateServe.port)
}
