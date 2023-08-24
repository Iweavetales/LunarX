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
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 30 }}>
            <img src={"/static/svg/emblem_symbol_only.svg"} width={200} />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <img src={"/static/svg/emblem_text_only.svg"} width={200} />
              <img
                src={"/static/svg/emblem_text_only.svg"}
                width={200}
                style={{ transform: "scaleY(-1)", opacity: 0.3 }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 30 }}>
          <Link href={"/about"}>To Abouts</Link>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
