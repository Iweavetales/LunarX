import React, { createContext, useContext } from "react"

export const HeadContext = createContext({})
export const Head = () => {
  const headContext = useContext(HeadContext)

  return <>{}</>
}

export const HeadSyncProvider = (props: {
  syncer: HeadSyncer
  children: React.ReactNode
}) => {
  return (
    <HeadContext.Provider value={{}}>{props.children}</HeadContext.Provider>
  )
}

export class HeadSyncer {}

// css 모듈 처리
// styled-components ssr
// head 시스템
