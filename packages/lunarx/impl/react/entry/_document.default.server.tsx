import { ServerContext } from "~/core/server-context"
import React from "react"
import { Body, Head } from "../document"

export default async function (
  context: ServerContext,
  Main: () => React.ReactElement
) {
  return (
    <html>
      <Head>
        <title>LunarJS</title>
      </Head>

      <Body>
        <Main />
      </Body>
    </html>
  )
}
