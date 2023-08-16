import { LunarContext } from '../src/lunarContext';
import React, { StrictMode } from 'react';
import { DocumentLinks, DocumentScripts } from '../src/document';
import reactDomServer from 'react-dom/server';
// import { ServerStyleSheet } from 'styled-components';

export default async function (context: LunarContext, res: Response | null , Main: () => React.ReactElement) {
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
  );
}
