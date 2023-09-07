import React from "react"
//
import { Outlet } from "react-router"
import { Link } from "lunarx/router"
import { useServerFetches } from "lunarx/ssfetch"
export default function IndexPage() {
  const fetchData = useServerFetches()

  return (
    <div>
      <div style={{ textAlign: "center" }}>
        <div>{fetchData?.data.depth} Depth</div>
        <div>
          <Link href={"/"}>To Index</Link>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
