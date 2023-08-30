import React from "react"
//
import { Outlet } from "react-router"
import { Link } from "lunarx/router"
export default function IndexPage() {
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
