import React from "react"
//
import { Outlet } from "react-router"
import { Link } from "lunarx/router"
// import { useServerFetches } from '../swift2/serverFetches';
export default function IndexPage() {
  // const serverFetches = useServerFetches();

  return (
    <div>
      <div style={{ textAlign: "center" }}>
        About
        <Link href={"/"}>To Index</Link>
        <Outlet />
      </div>
    </div>
  )
}
