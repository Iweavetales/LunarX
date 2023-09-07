import { ServerContext } from "lunarx/server"
import React from "react"
import { DocumentLinks, DocumentScripts } from "lunarx/document"

export default async function (
  context: ServerContext,
  Main: () => React.ReactElement
) {
  return (
    <html>
      <head>
        <title>LunarX-React</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="charset" content="utf-8" />

        <DocumentScripts />
        <DocumentLinks />

        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
      </head>
      <body>
        <Main />
      </body>
    </html>
  )
}
