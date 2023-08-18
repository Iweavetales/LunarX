import React from "react"
//
import { Outlet } from "react-router"
import { Link } from "@lunargate/lunar/router"
// import { useServerFetches } from '../swift2/serverFetches';
export default function IndexPage() {
  // const serverFetches = useServerFetches();

  return (
    <div>
      <img src={"/static/svg/LunarLogo.svg"} width={100} />
      LunarGate About
      <Link href={"/"}>To Index</Link>
      <Outlet />
    </div>
  )
}
