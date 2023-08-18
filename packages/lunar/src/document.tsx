import React, { createContext, useContext } from "react"

type ScriptDefine = {
  src?: string
  async?: boolean
  defer?: boolean
  element?: React.ReactNode
}
type LinkDefine = { href?: string; rel?: string; element?: React.ReactNode }

const DocumentInjectionContext = createContext<{
  nonce: string
  scripts: ScriptDefine[]
  links: LinkDefine[]
  // app: React.ReactElement;
  bootstrapScript: string
  bootstrapScriptId: string
} | null>(null)

export function DocumentWrapper(props: {
  children?: React.ReactNode
  nonce: string
  scripts: ScriptDefine[]
  links: LinkDefine[]
  bootstrapScript: string
  bootstrapScriptId: string
}) {
  return (
    <DocumentInjectionContext.Provider
      value={{
        nonce: props.nonce,
        scripts: props.scripts,
        links: props.links,
        // app: props.app,
        bootstrapScript: props.bootstrapScript,
        bootstrapScriptId: props.bootstrapScriptId,
      }}
    >
      {props.children}
    </DocumentInjectionContext.Provider>
  )
}

export function DocumentScripts() {
  const ctx = useContext(DocumentInjectionContext)
  if (ctx) {
    return (
      <>
        {ctx.scripts.map((script, index) => {
          if (script.element) {
            return script.element
          } else {
            return (
              <script
                src={script.src}
                async={script.async}
                defer={script.defer}
                nonce={ctx.nonce}
                key={script.src}
              ></script>
            )
          }
        })}
      </>
    )
  }

  return null
}

export function DocumentLinks() {
  const ctx = useContext(DocumentInjectionContext)
  if (ctx) {
    return (
      <>
        {ctx.links.map((link, index) => {
          if (link.element) {
            return link.element
          } else {
            return (
              <link
                href={link.href}
                rel={link.rel}
                nonce={ctx.nonce}
                key={link.href}
              ></link>
            )
          }
        })}
      </>
    )
  }

  return null
}
//
// export function App() {
//   const ctx = useContext(DocumentInjectionContext);
//   if (ctx) {
//     return ctx.app;
//   }
//   return null;
// }

export function Bootstrap() {
  const ctx = useContext(DocumentInjectionContext)
  if (ctx) {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html:
            ctx.bootstrapScript +
            // 화면이 로드 된 후에 데이터 태그를 숨기기 위해 삭제 한다
            `;document.getElementById("${ctx.bootstrapScriptId}").remove();`,
        }}
        nonce={ctx.nonce}
        id={ctx.bootstrapScriptId}
      />
    )
  }
  return null
}
