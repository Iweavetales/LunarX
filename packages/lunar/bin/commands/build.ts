import { copyFileSync, readFileSync } from "fs"
import { join } from "path"

export default async function Build(options: Record<any, any>) {
  console.log(options)

  /**
   * Builds the user's application utilizing the ApplicationBuilder program (located at ApplicationBuilder/index.js).
   * * The executable Lunar binary is constructed as the final step.
   * * Hence, by the time the Lunar binary file begins its build process, ApplicationBuilder/index.js will already exist.
   * The ApplicationBuilder from the lunar package is invoked to construct the user's application.
   */
  await require("../../dist/ApplicationBuilder/index.js").build(() => {
    console.log("built")
  })

  /**
   * Copy the `denoRuntime.js` file from the `lunar` package to the dist directory where the application is built.
   */
  copyFileSync(
    join(__dirname, "../denoRuntime/index.js"),
    join(process.cwd(), "./dist/deno-server.js")
  )
}
