import { SwiftRenderer } from "@lunargate/lunar/lunarApp"
import React from "react"
import { useServerFetches } from "@lunargate/lunar/serverFetches"
export default () => {
  const fetches = useServerFetches()

  console.log("fetches", fetches)
  return <SwiftRenderer />
}
