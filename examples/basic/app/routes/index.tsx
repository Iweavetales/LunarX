import React from "react"
import { Outlet } from "react-router"
import { Link } from "lunarx/router"

export default function IndexPage() {
  return (
    <div>
      LunarGate Index
      <Link href={"/about"}>To About</Link>
      <Outlet />
    </div>
  )
}
