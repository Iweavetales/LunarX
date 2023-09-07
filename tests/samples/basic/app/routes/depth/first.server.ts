import { ServerContext } from "lunarx/server"

export async function serverFetches(ctx: ServerContext) {
  await new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000)
  })

  return {
    data: {
      depth: "first",
    },
  }
}
