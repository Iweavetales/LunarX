import React from "react"
import { ServerContext } from "lunarx/server"
import { Head } from "lunarx/document"

export default async function (
  context: ServerContext,
  Main: () => React.ReactElement
) {
  return (
    <html>
      <Head>
        <title>LunarJS</title>
      </Head>

      <body>
        <Main />
      </body>
    </html>
  )
}
