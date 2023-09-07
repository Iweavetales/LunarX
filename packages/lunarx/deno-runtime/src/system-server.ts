import { RuntimeConfig } from "./config.ts"
import { Node } from "https://deno.land/x/router@v2.0.0/mod.js"
import { serve } from "https://deno.land/std@0.154.0/http/server.ts"
import { GetUrlPath } from "./url-utils.ts"
import { ResolveWebappStructure } from "./web-app-structure.ts"
import { LunarServer } from "./lunar-server.ts"
import { LoadManifest } from "./manifest.ts"
import { join } from "https://deno.land/std@0.150.0/path/mod.ts"

export function RunSystemServer(
  config: RuntimeConfig,
  swiftServer: LunarServer
) {
  const root = new Node()

  /**
   * Development 모드에서 사용되는 기능
   * 페이지 소스가 변경되면 applicationBuilder 로 부터 notice 를 받고
   * notice 가 도착하면 swiftServer 의 webApp 정보를 업데이트 하여 새로운 소스를 반영 한다
   */
  root.add("/app-builder/meta/updated", async () => {
    // req.

    console.log("[System] App-builder meta will updated.")
    const manifest = LoadManifest(
      join(config.js.distDirectory, "manifest.json")
    )
    const webAppStructure = await ResolveWebappStructure(
      manifest,
      config.js.routesRoot
    )

    swiftServer.updateWebApp(webAppStructure)
    console.log("[System] App-builder meta updated.")
    return new Response("ok")
  })
  // /**
  //  * Private Server 시작
  //  * 시스템관리용 API 제공
  //  */
  // serve(
  // 	async (req) => {
  // 		// 전체 URL 에서 패스만 추출
  // 		const urlPath = GetUrlPath(req.url);
  // 		console.log("[DEV SYSTEM SERVER] Received some request ", req.url)
  //
  // 		// 추출된 패스로 라우터 매칭
  // 		const [matchedHandler, params] = root.find(urlPath);
  // 		if (matchedHandler) {
  // 			return await matchedHandler(req, params);
  // 		}
  //
  // 		return new Response('', {
  // 			status: 404,
  // 		});
  // 	},
  // 	{
  // 		port: parseInt(config.privateServe.port),
  // 	},
  // );
}
