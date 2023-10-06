import ReactDomServer from "react-dom/server"
const { renderToPipeableStream, renderToReadableStream } = ReactDomServer
import React from "react"
import { ServerContext } from "~/core/server-context"
import { StaticRouter } from "react-router-dom/server"
import LunarAppContainer from "../lib/root-app-container"
import { DocumentSheet } from "~/core/document-types"
import { Bootstrap, DocumentWrapper } from "../document"
import DefaultDocumentFactory from "./_document.default.server"
import { RootElementID } from "~/core/constants"
import { SwiftRenderer } from "../app"
import { ServerFetchesProvider } from "../lib/server-fetches-provider"
import { TAppData } from "../lib/app-data"
import DefaultNotFoundPage from "./_404.default"
import DefaultErrorComponent from "./_error.default"
import { ServerResponse } from "http"
import lz from "lz-string"

export default async function handleRequest(
  context: ServerContext,
  documentSheet: DocumentSheet,
  res: ServerResponse
): Promise<string | boolean> {
  console.log("enter", context.req.url)
  /**
   * Server Side 랜더링 중에는 useLayoutEffect 를 호출 하여도 useEffect 로 호출 되도록 수정한다
   * styledComponents 의 createGlobalStyle 를 사용했을 때 경고 발생 방지를 위함
   */
  React.useLayoutEffect = React.useEffect

  // Render Document
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

  const stringifiedAppData = JSON.stringify(appData)
  process.env.NODE_ENV !== "production" &&
    console.log("Raw app data size", stringifiedAppData.length)

  let appDataStringArgument = ""
  // eslint-disable-next-line no-undef
  if (COMPRESSING_SSR_DATA) {
    process.env.NODE_ENV !== "production" &&
      console.time("server data compress time")
    appDataStringArgument = '"' + lz.compressToBase64(stringifiedAppData) + '"'
    process.env.NODE_ENV !== "production" &&
      console.timeEnd("server data compress time")
    process.env.NODE_ENV !== "production" &&
      console.log(
        "compressed size",
        appDataStringArgument.length,
        `(reduced ${Math.floor(
          100 - (appDataStringArgument.length / stringifiedAppData.length) * 100
        )}%)`
      )
  } else {
    process.env.NODE_ENV !== "production" &&
      console.time("server data stringify time")
    appDataStringArgument = '"' + btoa(stringifiedAppData) + '"'
    process.env.NODE_ENV !== "production" &&
      console.timeEnd("server data stringify time")
    process.env.NODE_ENV !== "production" &&
      console.log("stringify size", appDataStringArgument.length)
  }

  const bootstrapScriptTagId = "b_" + Math.floor(Math.random() * 100000)

  const bootstrapScript = ` window.addEventListener('DOMContentLoaded', function() {(function (){ 
            require([${browserEntryModulePathArgument}], function (modules) { 
              modules[0].default( 
                require,
                ${appDataStringArgument}, 
                ${ascRouteNodeArgument}, 
                ${customAppModuleShardPathArgument}, 
                ${browserEntryModulePathArgument},
                ${JSON.stringify(
                  new Array(
                    ...documentSheet.pageResourceBuilder.dependingScripts.values()
                  )
                )},
                ${JSON.stringify(
                  new Array(
                    ...documentSheet.pageResourceBuilder.dependingStyles.values()
                  )
                )},
                ${`document.getElementById('${bootstrapScriptTagId}').nonce`},
                ${JSON.stringify(documentSheet.custom404ShardPath)},
                ${JSON.stringify(documentSheet.customErrorShardPath)},
                ${JSON.stringify(documentSheet.err)}
              )
            })
          })()})`

  let App: () => React.ReactElement
  let DocumentFactory: typeof DefaultDocumentFactory

  /**
   * 플랫폼 사용자가 정의 한 App 컴포넌트가 있으면 해당 모듈을 로드 해서 사용 하고
   * 정의 한 모듈이 없다면 기본 App 형태인 SwiftRenderer 컴포넌트만 가진 컴포넌트를 사용 한다
   */
  if (documentSheet.customAppModuleShardPath) {
    App = documentSheet.requireFunction(
      documentSheet.customAppModuleShardPath
    ).default
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
    ).default
  } else {
    DocumentFactory = DefaultDocumentFactory
  }

  let NotFoundComponent: React.FunctionComponent
  if (documentSheet.custom404ShardPath) {
    NotFoundComponent = documentSheet.requireFunction(
      documentSheet.custom404ShardPath
    ).default
  } else {
    NotFoundComponent = DefaultNotFoundPage
  }

  let ErrorComponent: React.FunctionComponent
  if (documentSheet.customErrorShardPath) {
    ErrorComponent = documentSheet.requireFunction(
      documentSheet.customErrorShardPath
    ).default
  } else {
    ErrorComponent = DefaultErrorComponent
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
      documentSheet.requireFunction(routeNode.shardPath).default,
    ])
  ).then((pairs) =>
    /**
     * Reduce [[shardPath, React.FunctionComponent], ...] -> { ... }
     */
    pairs.reduce((acc, cur) => ({ ...acc, [cur[0]]: cur[1] }), {})
  )

  const documentContents = await DocumentFactory(context, () => (
    <>
      <div id={RootElementID}>
        <StaticRouter location={context.req.url!}>
          <LunarAppContainer
            initError={documentSheet.err}
            ascendRouteNodeList={documentSheet.universalRINListRootToLeaf}
            dataMatchMap={documentSheet.routeServerFetchesResultMap}
            enterLocation={context.location}
            loader={documentSheet.requireFunction}
            preloadedComponents={preloadedComponents}
            errorComponent={ErrorComponent}
            notFoundComponent={NotFoundComponent}
            routeShardPrepareTrigger={async () => {
              // Only used in client
              return
            }}
            staticHandler={undefined} // Defer implement data router
          >
            {/*_app.server.tsx 에 로드 한 데이터를 _app.tsx 에 공급 하기 위해 ServerFetchesProvider 사용*/}
            <ServerFetchesProvider
              dataKey={"_app"}
              directProvidedFetchResult={
                documentSheet.routeServerFetchesResultMap["_app"]
              }
            >
              <App />
            </ServerFetchesProvider>
          </LunarAppContainer>
        </StaticRouter>
      </div>

      <Bootstrap
        script={bootstrapScript}
        scriptId={bootstrapScriptTagId}
        nonce={documentSheet.nonce}
        defer
      />
    </>
  ))

  const advanceScripts = [
    {
      element: (
        <script
          src={documentSheet.loaderScriptUrl}
          nonce={documentSheet.nonce}
          defer
          key={"loader"}
        ></script>
      ),
    },
    ...documentSheet.advanceScripts.map((script) => ({
      src: script.url,
      defer: true,
      // async: script.async,
    })),
  ]
  const advanceStyles = [
    ...documentSheet.advanceStyles.map((style) => ({
      href: style.url,
      rel: "stylesheet",
    })),
  ]
  const secondScripts = documentSheet.secondScripts.map((script) => ({
    src: script.url,
    async: true,
    // async: script.async,
  }))
  const secondStyles = documentSheet.secondStyles.map((style) => ({
    href: style.url,
    rel: "stylesheet",
  }))
  /**
   * Document Element 를 DocumentWrapper 로 감싸 실제 데이터가 전달 되도록 한다
   */
  const Document = (
    <DocumentWrapper
      nonce={documentSheet.nonce}
      advanceScripts={advanceScripts}
      advanceLinks={advanceStyles}
      secondScripts={secondScripts}
      secondLinks={secondStyles}
      bootstrapScript={bootstrapScript}
      bootstrapScriptId={bootstrapScriptTagId}
    >
      {documentContents}
    </DocumentWrapper>
  )

  if (context._internal.runtime === "node" && renderToPipeableStream) {
    const stream = renderToPipeableStream(Document, {})

    res.writeHead(200, context.responseHeaders.asObject())
    // res.write("<!DOCTYPE html>")
    stream.pipe(res)
    return true
  } else if (context._internal.runtime === "deno" && renderToReadableStream) {
    // eslint-disable-next-line no-unused-expressions
    renderToReadableStream // @Todo implement
  }

  return `
    <!DOCTYPE html>
    ${ReactDomServer.renderToString(Document)}
  `
}
