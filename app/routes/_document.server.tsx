import { SwiftContext } from '../../packages/LunarGate/context';
import React, { StrictMode } from 'react';
import { Bootstrap, DocumentLinks, DocumentScripts } from '../../packages/LunarGate/Document';
import reactDomServer from 'react-dom/server';
// import { ServerStyleSheet } from 'styled-components';

export default async function (context: SwiftContext, res: Response, App: () => React.ReactElement) {
  // const sheet = new ServerStyleSheet();
  // const appMarkup = reactDomServer.renderToString(sheet.collectStyles(<App />));
  const appMarkup = reactDomServer.renderToString(<App />);

  return (
    <html>
      <head>
        <title>LunarJS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="charset" content="utf-8" />

        <DocumentScripts />
        <DocumentLinks />

        <script src="https://accounts.google.com/gsi/client" async defer></script>
        {/*{sheet.getStyleElement()}*/}
      </head>
      <body>
        <div id="app" dangerouslySetInnerHTML={{ __html: appMarkup }}></div>

        <Bootstrap />
      </body>
    </html>
  );
}
