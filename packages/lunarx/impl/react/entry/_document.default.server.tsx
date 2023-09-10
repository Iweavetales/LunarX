import { ServerContext } from "~/core/server-context"
import React, { StrictMode } from "react"
import { Head } from "../document"
import { Meta } from "../lib/head"

export default async function (
  context: ServerContext,
  Main: () => React.ReactElement
) {
  return (
    <html>
      <Head>
        <title>LunarJS</title>
        <Meta name={"test"} content={"hello"} />
        <Meta name={"test1"} content={"hello"} />
        <Meta name={"test2"} content={"hello"} />
        <Meta name={"test3"} content={"hello"} />
        <Meta name={"test54"} content={"hello"} />
        <Meta name={"tes6t"} content={"hello"} />
        <Meta name={"tes6t67"} content={"hello"} />
      </Head>

      <body>
        <Main />
      </body>
    </html>
  )
}
