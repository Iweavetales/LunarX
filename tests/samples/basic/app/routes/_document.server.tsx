import React from "react"
import { ServerContext } from "lunarx/server"
import { Body, Head } from "lunarx/document"

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
