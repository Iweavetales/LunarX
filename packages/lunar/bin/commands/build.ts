import { copyFileSync, readFileSync } from "fs"
import { join } from "path"

export default async function Build(options: Record<any, any>) {
  /**
   * Builds the user's application utilizing the builder program (located at builder/index.js).
   * * The executable Lunar binary is constructed as the final step.
   * * Hence, by the time the Lunar binary file begins its build process, builder/index.js will already exist.
   * The builder from the lunar package is invoked to construct the user's application.
   */
  await require("../../dist/builder/index.js").build(() => {
    console.log("built")
  })

  /**
   * Copy the `deno-runtime.js` file from the `lunar` package to the dist directory where the application is built.
   */
  copyFileSync(
    join(__dirname, "../deno-runtime/deno-server.js"),
    join(process.cwd(), "./dist/deno-server.js")
  )

  /**
   * Copy the `deno-runtime.js` file from the `lunar` package to the dist directory where the application is built.
   */
  copyFileSync(
    join(__dirname, "../node-runtime/node-server.js"),
    join(process.cwd(), "./dist/node-server.js")
  )
  copyFileSync(
    join(__dirname, "../node-runtime/node-server.js.map"),
    join(process.cwd(), "./dist/node-server.js.map")
  )
}
