import React from "react"
//
import { Outlet } from "react-router"
import { Link } from "lunarx/router"
import { useServerFetches } from "lunarx/ssfetch"

export default function IndexPage() {
  const serverFetches = useServerFetches()
  const posts = serverFetches?.data?.posts || []
  console.log("posts", posts)
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
          <div>
            <Link href={"/about"}>To Abouts</Link>
          </div>
          <div>
            <Link href={"/depth/first"}>To First</Link>
          </div>
          <div>
            <Link href={"/depth/first/second"}>To Second</Link>
          </div>
          <div>
            <Link href={"/depth/first/second/third"}>To Third</Link>
          </div>
        </div>

        <h1 style={{ textAlign: "left" }}>Posts</h1>
        <div
          style={{
            height: 200,
            overflow: "auto",
            backgroundColor: "#bbb",
            border: "1px solid #333",
          }}
        >
          <ul style={{ textAlign: "left" }}>
            {posts.map(
              (post: {
                body: string
                id: number
                title: string
                userId: number
              }) => (
                <li key={post.id}>
                  <Link href={`/post/${post.id}`}>
                    [{post.id}] {post.title}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>

        <Outlet />
      </div>
    </div>
  )
}
