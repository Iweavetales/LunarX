import React from "react"
//
import { Outlet } from "react-router"
import { Link } from "lunarx/router"
// import { useServerFetches } from '../swift2/serverFetches';
const anExampleVariable = "Hello World"
console.log(anExampleVariable)

export default function IndexPage() {
  // const serverFetches = useServerFetches();

  return (
    <div>
      <div style={{ textAlign: "center" }}>
        <div>
          <img src={"/static/svg/emblem.svg"} width={100} />
        </div>
        <Link href={"/about"}>To About</Link>
        <Outlet />
      </div>
    </div>
  )
}
