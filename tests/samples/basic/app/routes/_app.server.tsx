import { ServerContext } from "lunarx/server"
export async function serverFetches(ctx: ServerContext) {
  // /client-session/info

  return {
    data: {
      ENV: {
        NODE_ENV: "development",
      },
      userAgent: ctx.requestHeaders.get("user-agent"),
    },
  }
}
