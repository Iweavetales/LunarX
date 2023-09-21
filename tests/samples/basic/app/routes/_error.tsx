import React from "react"
import { useSSRError } from "lunarx/ssfetch"
export default function ErrorComponent() {
  const error = useSSRError()
  return <div>Custom Error Component</div>
}
