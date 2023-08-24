import { RuntimeConfig } from "./config"
import {
  ShardMeta,
  ClientAppStructure,
  MakeClientAppStructureFromManifest,
} from "./client-app-structure"
import { BuildRoutes } from "./routing-builder"

import { GetUrlPath } from "./urlUtils"

import Router, { HTTPVersion, Instance as RouterInstance } from "find-my-way"
import http, { IncomingMessage, ServerResponse } from "http"
import { join } from "path"
import { ReadJson } from "./json-reader"
import { LunarJSManifest, ShardPath } from "../../lib/manifest"
import WebSocket, { WebSocketServer } from "ws"
import { parse } from "url"

export type ServerOptions = {
  BuildDir: string
}
/**
 * A Server class provides pages for LunarJS
 */
export class LunarServer {
  options: ServerOptions

  running = false
  router: RouterInstance<HTTPVersion.V1>
  wsConnectionPool: WebSocket[]

  constructor(options: ServerOptions) {
    this.options = options
    this.wsConnectionPool = []
    this.router = Router()
    this.router.on(
      "GET",
      "*",
      async (req: IncomingMessage, res: ServerResponse) => {
        return res.writeHead(200).end("I'm Busy")
      }
    )
  }

  async load(updatedShardPaths: ShardPath[]) {
    const runtimeConfig = ReadJson<RuntimeConfig>(
      join(this.options.BuildDir, "runtime.json")
    )

    const manifest = ReadJson<LunarJSManifest>(
      join(runtimeConfig.js.distDirectory, "manifest.json")
    )

    const structure = await MakeClientAppStructureFromManifest(manifest)
    this.updateWebApp(structure, updatedShardPaths)
  }

  /**
   * 입력된 webAppStructure 로
   * 라우터와 웹엡 구조를 업데이트 한다
   * @param webApp
   */
  updateWebApp(structure: ClientAppStructure, updatedShardPaths: ShardPath[]) {
    this.router = BuildRoutes(structure.Manifest.routeNodes, structure)

    for (const ws of this.wsConnectionPool) {
      ws.send(JSON.stringify({ type: "updated-sources", updatedShardPaths }))
    }
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
      this.router.lookup(req, res)
    })

    server.on("upgrade", function upgrade(req, socket, head) {
      const { pathname } = parse(req.url!)
      if (pathname === "/_hmr") {
        hmrWebsocketServer.handleUpgrade(req, socket, head, function done(ws) {
          hmrWebsocketServer.emit("connection", ws, req)
        })
      }
    })

    const hmrWebsocketServer = new WebSocketServer({ noServer: true })
    hmrWebsocketServer.on("connection", (ws) => {
      this.wsConnectionPool.push(ws)

      console.log("Connection something...")
      ws.on("error", console.error)
      ws.on("message", function message(data) {
        console.log("received: %s", data)
      })
      ws.on("close", () => {
        this.wsConnectionPool = this.wsConnectionPool.filter(
          (oldWS) => oldWS === ws
        )
        ws.close()
      })

      ws.send("Hi,")
    })

    // server.on("upgrade", (req, socket, head) => {
    //   console.log("Requested upgrade")
    //   socket.write(
    //     "HTTP/1.1 101 Switching Protocols\r\n" +
    //       "Upgrade: websocket\r\n" +
    //       "Connection: Upgrade\r\n" +
    //       "Sec-WebSocket-Accept: HSmrc0sMlYUkAGmm5OPpG2HaGWk=\r\n" +
    //       "Sec-WebSocket-Protocol: chat\r\n" +
    //       "\r\n"
    //   )
    //   //
    //   // socket.pipe(socket) // echo back
    //   // socket.write("Hello")
    //
    //   socket.on("data", (a, b, c) => {
    //     console.log("abc", a, b, c)
    //   })
    // })

    const port = envPort ?? 3000
    server.listen(port, () => {
      console.log(`Server listening on: http://localhost:${port}`)
    })
  }
}
