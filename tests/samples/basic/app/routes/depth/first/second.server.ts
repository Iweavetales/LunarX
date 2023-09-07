import { ServerContext } from "lunarx/server"

export async function serverFetches(ctx: ServerContext) {
  await new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000)
  })

  throw new Error("Errorsss")
  return {
    data: {
      depth: "second",
    },
  }
}
