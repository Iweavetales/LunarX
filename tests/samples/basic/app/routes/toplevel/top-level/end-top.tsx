import React from "react"
import { useServerFetches } from "lunarx/ssfetch"
//
import { Outlet } from "react-router"
import { Link } from "lunarx/router"
export default function IndexPage() {
  const data = useServerFetches()
  console.log("data", data)
  return (
    <div>
      <div style={{ textAlign: "center" }}>
        <div>Top</div>
        <div>
          <Link href={"/"}>To Index</Link>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
