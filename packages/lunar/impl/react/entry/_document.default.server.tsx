import { ServerContext } from "~/core/lunar-context"
import React, { StrictMode } from "react"
import { DocumentLinks, DocumentScripts } from "../document"

export default async function (
  context: ServerContext,
  Main: () => React.ReactElement
) {
  return (
    <html>
      <head>
        <title>LunarJS</title>
        <DocumentScripts />
        <DocumentLinks />
      </head>
      <body>
        <Main />
      </body>
    </html>
  )
}
