// import { spawn } from "child_process"
// import { join } from "path"
//
// const server = spawn("deno", [
//   "run",
//
//   "--allow-all",
//   join(process.cwd(), options.buildDir, "deno-server.js"),
// ])
//
// server.stdout.on("data", (data) => {
//   console.log(`stdout: ${data}`)
// })
//
// server.stderr.on("data", (data) => {
//   console.error(`stderr: ${data}`)
// })
//
// server.on("close", (code) => {
//   console.log(`child process exited with code ${code}`)
// })
