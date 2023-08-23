import { SwiftRenderer } from "lunarx/app"
import React from "react"
import { useServerFetches } from "lunarx/ssfetch"

export default () => {
  const fetches = useServerFetches()

  console.log("fetches", fetches)
  return <SwiftRenderer />
}
