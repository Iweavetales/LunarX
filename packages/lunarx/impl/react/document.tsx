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
  advanceScripts: ScriptDefine[]
  advanceLinks: LinkDefine[]
  secondScripts: ScriptDefine[]
  secondLinks: LinkDefine[]
  // app: React.ReactElement;
  bootstrapScript: string
  bootstrapScriptId: string
} | null>(null)

export function DocumentWrapper(props: {
  children?: React.ReactNode
  nonce: string

  // advance party resources for current route
  advanceScripts: ScriptDefine[]
  advanceLinks: LinkDefine[]

  // second party resources for other route
  secondScripts: ScriptDefine[]
  secondLinks: LinkDefine[]

  bootstrapScript: string
  bootstrapScriptId: string
}) {
  return (
    <DocumentInjectionContext.Provider
      value={{
        nonce: props.nonce,
        advanceScripts: props.advanceScripts,
        advanceLinks: props.advanceLinks,

        secondScripts: props.secondScripts,
        secondLinks: props.secondLinks,
        // app: props.app,
        bootstrapScript: props.bootstrapScript,
        bootstrapScriptId: props.bootstrapScriptId,
      }}
    >
      {props.children}
    </DocumentInjectionContext.Provider>
  )
}

export function DocumentResourcePrefetch() {
  const ctx = useContext(DocumentInjectionContext)
  if (ctx) {
    return (
      <>
        {[...ctx.advanceScripts, ...ctx.secondScripts].map((script, index) => {
          if (script.element) {
            return script.element
          } else {
            return (
              <link
                rel="prefetch"
                href={script.src}
                as="script"
                nonce={ctx.nonce}
                key={script.src}
              ></link>
            )
          }
        })}
        {[...ctx.advanceLinks, ...ctx.secondLinks].map((style, index) => {
          if (style.element) {
            return style.element
          } else {
            return (
              <link
                rel="prefetch"
                href={style.href}
                as="style"
                nonce={ctx.nonce}
                key={style.href}
              ></link>
            )
          }
        })}
      </>
    )
  }

  return null
}
export function DocumentScripts() {
  const ctx = useContext(DocumentInjectionContext)
  if (ctx) {
    return (
      <>
        {ctx.advanceScripts.map((script, index) => {
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

export const Body = (props: {
  children: React.ReactNode
  autoLoadAllLeftResources?: boolean
}) => {
  const ctx = useContext(DocumentInjectionContext)
  return (
    <body>
      {props.children}
      {(props.autoLoadAllLeftResources ?? true) &&
        ctx?.secondLinks.map((link, index) => {
          if (link.element) {
            return link.element
          } else {
            return <link href={link.href} rel={link.rel} key={link.href}></link>
          }
        })}
      {(props.autoLoadAllLeftResources ?? true) &&
        ctx?.secondScripts.map((script, index) => {
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
    </body>
  )
}

export function DocumentLinks() {
  const ctx = useContext(DocumentInjectionContext)
  if (ctx) {
    return (
      <>
        {ctx.advanceLinks.map((link, index) => {
          if (link.element) {
            return link.element
          } else {
            return <link href={link.href} rel={link.rel} key={link.href}></link>
          }
        })}
      </>
    )
  }

  return null
}
export const Head = (props: {
  children: React.ReactNode
  activatePrefetch?: boolean
}) => {
  return (
    <head>
      {props.children}
      {(props.activatePrefetch ?? true) && <DocumentResourcePrefetch />}
      <DocumentScripts />
      <DocumentLinks />
    </head>
  )
}

export function Bootstrap(props: {
  script: string
  scriptId: string
  nonce: string
  defer?: boolean
  async?: boolean
}) {
  const scriptContent = props.script

  return (
    <script
      defer={props.defer ? true : false}
      async={props.async ? true : false}
      dangerouslySetInnerHTML={{
        __html: scriptContent,
      }}
      nonce={props.nonce}
      data-lunar={"bootstrap"}
      id={props.scriptId}
    />
  )
}
