import { RuntimeConfig } from "./config.ts"
import { WebAppStructure } from "./web-app-structure.ts"
import { BuildRoutes, Node } from "./server-routing.ts"

import { GetUrlPath } from "./url-utils.ts"
import FsFile = Deno.FsFile
import { httpServe, join } from "./deps.ts"

/**
 * A Server class provides pages for LunarJS
 */
export class LunarServer {
  config: RuntimeConfig
  cwd: string
  running = false
  router: Node
  webApp: WebAppStructure

  constructor(config: RuntimeConfig, cwd: string, webapp: WebAppStructure) {
    this.config = config
    this.cwd = cwd
    this.webApp = webapp
    this.router = BuildRoutes(this.webApp.Manifest.routeNodes)
  }

  /**
   * 입력된 webAppStructure 로
   * 라우터와 웹엡 구조를 업데이트 한다
   * @param webApp
   */
  updateWebApp(webApp: WebAppStructure) {
    this.router = BuildRoutes(webApp.Manifest.routeNodes)
    this.webApp = webApp
  }

  getDistFilePath(distPath: string): string {
    return join(this.cwd, distPath)
  }

  async getShardFile(shardPath: string): Promise<FsFile | null> {
    const nodeEnv = Deno.env.get("NODE_ENV")
    /**
     * production 모드 일떄만 map 파일 제공
     */
    if (nodeEnv !== "production" && /\.map$/.test(shardPath)) {
      shardPath = shardPath.replace(/\.map$/, "")
      const shard = this.webApp.BrowserShards[shardPath]
      return await Deno.open(this.getDistFilePath(shard.RealPath + ".map"), {
        read: true,
      })
    }

    const shard = this.webApp.BrowserShards[shardPath]

    if (shard) {
      // const relativePath = this.webApp.SourceFileMap[filename];
      // console.log('relativePath', this.webApp.SourceFileMap, filename, relativePath);
      const scriptFile = await Deno.open(this.getDistFilePath(shard.RealPath), {
        read: true,
      })

      return scriptFile
    }

    return null
  }
  setupHMR() {}

  // resolveSourcePath(sourceId: string) {}

  async run() {
    if (this.running) {
      console.error("Swift server is already running")
      return
    }

    const envPortString = Deno.env.get("PORT")
    let envPort: number | null = null
    if (envPortString) {
      try {
        envPort = parseInt(envPortString)
      } catch (e) {
        console.error(e)
      }
    }

    /**
     * 웹서버 시작
     */
    await httpServe(
      async (req) => {
        if (!this.webApp) {
          return new Response("not ready", {
            status: 404,
            headers: {
              "content-type": "text/html; charset=utf-8",
            },
          })
        }

        if (!this.router) {
          return new Response("not ready", {
            status: 404,
            headers: {
              "content-type": "text/html; charset=utf-8",
            },
          })
        }

        // 전체 URL 에서 패스만 추출
        const urlPath = GetUrlPath(req.url)
        const queryStartIndex = urlPath.indexOf("?")
        const onlyPath = urlPath.substring(
          0,
          queryStartIndex === -1 ? urlPath.length : queryStartIndex
        )

        // 추출된 패스로 라우터 매칭
        const [matchedHandler, params] = this.router.find(onlyPath)

        // 매치된 라우트가 있으면 랜더링
        if (matchedHandler) {
          return await matchedHandler(req, params, this)
        } else {
          // 페이지가 없을 경우 스태틱 리소스 확인
        }

        return new Response("Page not found", {
          status: 404,
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        })
      },
      {
        port: envPort ?? 3000,
      }
    )
  }
}
