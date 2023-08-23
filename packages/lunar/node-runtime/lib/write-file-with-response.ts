import { ServerResponse } from "http"
import { readFileSync, statSync } from "fs"
import { getType } from "mime"

export function writeFileToResponse(filePath: string, res: ServerResponse) {
  let fileSize
  try {
    const stat = statSync(filePath)

    fileSize = stat.size
  } catch (e) {
    return res.writeHead(404).end()
  }

  try {
    // const writing = res.writeHead(200, {
    //     "content-length": fileSize.toString(),
    //     "content-type": getType(filePath) || "application/octet-stream",
    // })
    // const readable = createReadStream(filePath)
    // readable.on("data", function (chunk) {
    //     writing.write(chunk)
    // })
    // readable.on("end", function () {
    //     writing.end()
    // })
    // return  writing
    const data = readFileSync(filePath)

    return res
      .writeHead(200, {
        "content-length": fileSize.toString(),
        "content-type": getType(filePath) || "application/octet-stream",
      })
      .end(data)
  } catch (e) {
    console.error("error serve static", e)
    return res.writeHead(500, {}).end()
  }
}
