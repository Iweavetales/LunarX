import reactDomServer from "react-dom/server"
import React, { StrictMode } from "react"
import { ServerContext } from "~/core/lunar-context"
import { StaticRouter } from "react-router-dom/server"
import LunarAppContainer from "../lib/root-app-container"
import { DocumentSheet } from "~/core/document-types"
import { Bootstrap, DocumentWrapper } from "../document"
import DefaultDocumentFactory from "./_document.default.server"
import { RootElementID } from "~/core/constants"
import { SwiftRenderer } from "../app"
import { ServerFetchesProvider } from "../lib/server-fetches-provider"
import { TAppData } from "../lib/app-data"
// import App from '../routes/_app';

export default async function handleRequest(
  context: ServerContext,
  documentSheet: DocumentSheet
): Promise<string> {
  /**
   * Server Side 랜더링 중에는 useLayoutEffect 를 호출 하여도 useEffect 로 호출 되도록 수정한다
   * styledComponents 의 createGlobalStyle 를 사용했을 때 경고 발생 방지를 위함
   */
  React.useLayoutEffect = React.useEffect

  // Render Document
  const enteredRouteDataArgument = JSON.stringify(
    documentSheet.routeServerFetchesResultMap
  )
  const ascRouteNodeArgument = JSON.stringify(
    documentSheet.universalRINListRootToLeaf
  )

  const customAppModuleShardPathArgument =
    documentSheet.customAppModuleShardPath
      ? JSON.stringify(documentSheet.customAppModuleShardPath)
      : undefined

  const browserEntryModulePathArgument = documentSheet.browserEntryModulePath
    ? JSON.stringify(documentSheet.browserEntryModulePath)
    : undefined

  const appData: TAppData = {
    rd: documentSheet.routeServerFetchesResultMap,
  }

  const bootstrapScript = `(function (){ 
            require([${browserEntryModulePathArgument}], function (modules) { 
              modules[0].default( 
                require,
                ${JSON.stringify(appData)}, 
                ${ascRouteNodeArgument}, 
                ${customAppModuleShardPathArgument}, 
                ${browserEntryModulePathArgument}
              )
            })
          })()`

  let App: () => React.ReactElement
  let DocumentFactory: typeof DefaultDocumentFactory

  /**
   * 플랫폼 사용자가 정의 한 App 컴포넌트가 있으면 해당 모듈을 로드 해서 사용 하고
   * 정의 한 모듈이 없다면 기본 App 형태인 SwiftRenderer 컴포넌트만 가진 컴포넌트를 사용 한다
   */
  if (documentSheet.customAppModuleShardPath) {
    App = documentSheet.requireFunction(documentSheet.customAppModuleShardPath)
  } else {
    App = () => <SwiftRenderer />
  }

  /**
   * 플랫폼 사용자가 정의 한 Document 컴포넌트가 있으면 해당 모듈을 로드 해서 사용 하고
   * 정의 한 모듈이 없다면 기본 Document 형태인 DefaultDocument 컴포넌트를 사용한다.
   */
  if (documentSheet.customDocumentModuleShardPath) {
    DocumentFactory = documentSheet.requireFunction(
      documentSheet.customDocumentModuleShardPath
    )
  } else {
    DocumentFactory = DefaultDocumentFactory
  }

  /**
   * Preparing all components before server-side rendering within the router.
   * {
   *     [string:ShardPath]: React.FunctionComponent,
   *     ...
   * }
   */
  const preloadedComponents = await Promise.all(
    /**
     * Resolves [shardPath, React.FunctionComponent]
     */
    documentSheet.universalRINListRootToLeaf.map(async (routeNode) => [
      routeNode.shardPath,
      documentSheet.requireFunction(routeNode.shardPath),
    ])
  ).then((pairs) =>
    /**
     * Reduce [[shardPath, React.FunctionComponent], ...] -> { ... }
     */
    pairs.reduce((acc, cur) => ({ ...acc, [cur[0]]: cur[1] }), {})
  )

  /**
   * Document Element 를 DocumentWrapper 로 감싸 실제 데이터가 전달 되도록 한다
   */
  const DocumentElement = (
    <DocumentWrapper
      nonce={documentSheet.nonce}
      scripts={[
        {
          element: (
            <script
              src={documentSheet.loaderScriptUrl}
              nonce={documentSheet.nonce}
              key={"loader"}
            ></script>
          ),
        },
        ...documentSheet.scripts.map((script) => ({
          src: script.url,
        })),
      ]}
      links={[
        ...documentSheet.styles.map((style) => ({
          href: style.url,
          rel: "stylesheet",
        })),
      ]}
      bootstrapScript={bootstrapScript}
      bootstrapScriptId={"s_" + Math.floor(Math.random() * 100000)}
    >
      {await DocumentFactory(context, () => (
        <>
          <div id={RootElementID}>
            <StaticRouter location={context.req.url!}>
              <LunarAppContainer
                ascendRouteNodeList={documentSheet.universalRINListRootToLeaf}
                dataMatchMap={documentSheet.routeServerFetchesResultMap}
                enterLocation={context.location}
                loader={documentSheet.requireFunction}
                preloadedComponents={preloadedComponents}
                routeShardPrepareTrigger={async () => {
                  // Only used in client
                  return
                }}
              >
                {/*_app.server.tsx 에 로드 한 데이터를 _app.tsx 에 공급 하기 위해 ServerFetchesProvider 사용*/}
                <ServerFetchesProvider dataKey={"_app"}>
                  <App />
                </ServerFetchesProvider>
              </LunarAppContainer>
            </StaticRouter>
          </div>
          <Bootstrap
            script={bootstrapScript}
            scriptId={"s_" + Math.floor(Math.random() * 100000)}
            nonce={documentSheet.nonce}
          />
        </>
      ))}
    </DocumentWrapper>
  )

  return `
    <!DOCTYPE html>
    ${reactDomServer.renderToString(DocumentElement)}
  `
}
