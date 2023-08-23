import React from "react"
import { Outlet } from "react-router"
import { Link } from "lunarx/router"

export default function AboutPage() {
  return (
    <div>
      <img src={"/static/svg/LunarLogo.svg"} width={100} />
      LunarGate About
      <Link href={"/"}>To Index</Link>
      <Outlet />
    </div>
  )
}
