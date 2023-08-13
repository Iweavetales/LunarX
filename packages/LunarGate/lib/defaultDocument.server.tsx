import { SwiftContext } from '../context';
import React, { StrictMode } from 'react';
import { Bootstrap, DocumentLinks, DocumentScripts } from '../Document';
import reactDomServer from 'react-dom/server';
// import { ServerStyleSheet } from 'styled-components';

export default async function (context: SwiftContext, res: Response | null , App: () => React.ReactElement) {
  // const sheet = new ServerStyleSheet();
  // const appMarkup = reactDomServer.renderToString(sheet.collectStyles(<App />));
  const appMarkup = reactDomServer.renderToString(<App />);

  return (
    <html>
      <head>
        <title>LunarJS</title>
        <DocumentScripts />
        <DocumentLinks />
      </head>
      <body>
        <div id="app" dangerouslySetInnerHTML={{ __html: appMarkup }}></div>

        <Bootstrap />
      </body>
    </html>
  );
}
