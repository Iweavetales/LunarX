import { ServerContext } from "../../../lib/lunar-context"
import React, { StrictMode } from "react"
import { DocumentLinks, DocumentScripts } from "../document"
import reactDomServer from "react-dom/server"
// import { ServerStyleSheet } from 'styled-components';

export default async function (
  context: ServerContext,
  Main: () => React.ReactElement
) {
  // const sheet = new ServerStyleSheet();
  // const appMarkup = reactDomServer.renderToString(sheet.collectStyles(<App />));
  // const appMarkup = reactDomServer.renderToString(<App />);

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
