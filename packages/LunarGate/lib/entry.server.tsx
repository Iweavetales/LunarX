import reactDomServer from 'react-dom/server';
import React, { StrictMode } from 'react';
import { SwiftContext } from '../context';
import { StaticRouter } from 'react-router-dom/server';
import SwiftAppContainer, { SwiftRenderer } from '../SwiftApp';
import { DocumentSheet } from '../DocumentTypes';
import { DocumentWrapper } from '../Document';
import DefaultDocumentFactory from './defaultDocument.server';
import { ServerFetchesProvider } from '../serverFetches';
// import App from '../routes/_app';

export default async function handleRequest(context: SwiftContext, documentSheet: DocumentSheet, LunarJSApp: any) {
  /**
   * Server Side 랜더링 중에는 useLayoutEffect 를 호출 하여도 useEffect 로 호출 되도록 수정한다
   * styledComponents 의 createGlobalStyle 를 사용했을 때 경고 발생 방지를 위함
   */
  React.useLayoutEffect = React.useEffect;


  console.log("documentSheet",documentSheet)

  // Render Document
  const enteredRouteData = JSON.stringify(documentSheet.routeServerFetchesResultMap);
  const ascRouteNode = JSON.stringify(documentSheet.ascendRouteNodeList);
  const bootstrapScript = `(function (){ 
            var APP_DATA = {rd:${enteredRouteData}, ascRouteNodes:${ascRouteNode}};
            
            require(["${documentSheet.browserEntryModulePath}"], function (modules) {
              modules[0].default(APP_DATA, ${ascRouteNode}, "${documentSheet.customAppModuleShardPath}", require)
            })
          })()`;

  let App: () => React.ReactElement;
  let DocumentFactory: typeof DefaultDocumentFactory;

  /**
   * 플랫폼 사용자가 정의 한 App 컴포넌트가 있으면 해당 모듈을 로드 해서 사용 하고
   * 정의 한 모듈이 없다면 기본 App 형태인 SwiftRenderer 컴포넌트만 가진 컴포넌트를 사용 한다
   */
  if (documentSheet.customAppModuleShardPath) {
    App = documentSheet.requireFunction(documentSheet.customAppModuleShardPath);
    // App = await import(documentSheet.customAppModuleShardPath);
  } else {
    App = () => <SwiftRenderer />;
  }

  /**
   * 플랫폼 사용자가 정의 한 Document 컴포넌트가 있으면 해당 모듈을 로드 해서 사용 하고
   * 정의 한 모듈이 없다면 기본 Document 형태인 DefaultDocument 컴포넌트를 사용한다.
   */
  if (documentSheet.customDocumentModuleShardPath) {
    DocumentFactory = documentSheet.requireFunction(documentSheet.customDocumentModuleShardPath);
  } else {
    DocumentFactory = DefaultDocumentFactory;
  }

  /**
   * DocumentFactory 함수를 호출 하여 DocumentElement 를 생성한다
   */
  const documentElement = await DocumentFactory(context, null, () => (
    <StaticRouter location={context.path}>
      <SwiftAppContainer
        ascendRouteNodeList={documentSheet.ascendRouteNodeList}
        dataMatchMap={documentSheet.routeServerFetchesResultMap}
        enterLocation={context.location}
        loader={documentSheet.requireFunction}
      >
        {/*_app.server.tsx 에 로드 한 데이터를 _app.tsx 에 공급 하기 위해 ServerFetchesProvider 사용*/}
        <ServerFetchesProvider dataKey={'_app'}>
          <App />
        </ServerFetchesProvider>
      </SwiftAppContainer>
    </StaticRouter>
  ));

  /**
   * Document Element 를 DocumentWrapper 로 감싸 실제 데이터가 전달 되도록 한다
   */
  const DocumentElement = (
    <DocumentWrapper
      nonce={documentSheet.nonce}
      scripts={[
        {
          element: <script src={documentSheet.loaderScriptUrl} nonce={documentSheet.nonce} key={'loader'}></script>,
        },
        ...documentSheet.scripts.map(script => ({
          src: script.url,
        })),
      ]}
      links={[...documentSheet.styles.map(style => ({ href: style.url, rel: 'stylesheet' }))]}
      bootstrapScript={bootstrapScript}
      bootstrapScriptId={'s_' + Math.floor(Math.random() * 100000)}
    >
      {documentElement}
    </DocumentWrapper>
  );

  console.log("DocumentElement",DocumentElement)
  return `
    <!DOCTYPE html>
    ${reactDomServer.renderToString(DocumentElement)}
  `;
}
