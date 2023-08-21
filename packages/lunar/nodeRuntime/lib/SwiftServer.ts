import { RuntimeConfig } from "./Config"
import { ShardMeta, WebAppStructure } from "./WebAppStructure"
import { BuildRoutes } from "./SwiftServerRouting"

import { GetUrlPath } from "./urlUtils"

import { open, openSync } from "fs"
import { HTTPVersion, Instance as RouterInstance } from "find-my-way"
import http from "http"
import { join } from "path"
/**
 * A Server class provides pages for LunarJS
 */
export class SwiftServer {
  config: RuntimeConfig
  cwd: string
  running = false
  router: RouterInstance<HTTPVersion.V1>
  webApp: WebAppStructure

  constructor(config: RuntimeConfig, cwd: string, webapp: WebAppStructure) {
    this.config = config
    this.cwd = cwd
    this.webApp = webapp
    this.router = BuildRoutes(this.webApp.Manifest.routeNodes, this)
  }

  /**
   * 입력된 webAppStructure 로
   * 라우터와 웹엡 구조를 업데이트 한다
   * @param webApp
   */
  updateWebApp(webApp: WebAppStructure) {
    this.router = BuildRoutes(webApp.Manifest.routeNodes, this)
    this.webApp = webApp
  }

  getDistFilePath(distPath: string): string {
    return join(this.cwd, distPath)
  }

  isBrowserShardFile(shardPath: string): boolean {
    const shard = this.webApp.BrowserShards[shardPath]

    return Boolean(shard)
  }

  getShard(shardPath: string): ShardMeta | undefined {
    return this.webApp.BrowserShards[shardPath]
  }

  getShardFile(shardPath: string): number | null {
    const nodeEnv = process.env.NODE_ENV
    /**
     * production 모드 일떄만 map 파일 제공
     */
    if (nodeEnv !== "production" && /\.map$/.test(shardPath)) {
      shardPath = shardPath.replace(/\.map$/, "")
      const shard = this.webApp.BrowserShards[shardPath]
      return openSync(this.getDistFilePath(shard.RealPath + ".map"), "r")
    }

    const shard = this.webApp.BrowserShards[shardPath]

    if (shard) {
      // const relativePath = this.webApp.SourceFileMap[filename];
      // console.log('relativePath', this.webApp.SourceFileMap, filename, relativePath);
      const scriptPath = this.getDistFilePath(shard.RealPath)

      return openSync(scriptPath, "r")
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

    const envPortString = process.env.PORT
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
    const server = http.createServer(async (req, res) => {
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
      const urlPath = GetUrlPath(req.url!)
      const queryStartIndex = urlPath.indexOf("?")
      const onlyPath = urlPath.substring(
        0,
        queryStartIndex === -1 ? urlPath.length : queryStartIndex
      )

      // 추출된 패스로 라우터 매칭
      // const [matchedHandler, params] = this.router.find(onlyPath)
      this.router.lookup(req, res)

      // 매치된 라우트가 있으면 랜더링
      // if (matchedHandler) {
      //   return await matchedHandler(req, params, this)
      // } else {
      //   // 페이지가 없을 경우 스태틱 리소스 확인
      // }
      //
      // return new Response("Page not found", {
      //   status: 404,
      //   headers: {
      //     "content-type": "text/html; charset=utf-8",
      //   },
      // })
    })

    const port = envPort ?? 3000
    server.listen(port, () => {
      console.log(`Server listening on: http://localhost:${port}`)
    })
    // server.close((err) => {
    //   console.log("Server error ", err)
    //   if (err) throw err
    // })
  }
}
