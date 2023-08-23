const http = require("node:http")

// Create an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" })
  res.end("okay")
})
server.on("upgrade", (req, socket, head) => {
  socket.write(
    "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" +
      "Upgrade: WebSocket\r\n" +
      "Connection: Upgrade\r\n" +
      "\r\n"
  )

  socket.pipe(socket) // echo back
})

// Now that server is running
server.listen(1337, "127.0.0.1", () => {
  // make a request
  const options = {
    port: 1337,
    host: "127.0.0.1",
    headers: {
      Connection: "Upgrade",
      Upgrade: "websocket",
    },
  }

  const req = http.request(options)
  req.end()

  req.on("upgrade", (res, socket, upgradeHead) => {
    console.log("got upgraded!")
    socket.end()
    process.exit(0)
  })
})
