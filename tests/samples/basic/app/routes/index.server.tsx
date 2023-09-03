import { ServerContext } from "lunarx/context"

export async function serverFetches(ctx: ServerContext) {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts")

  return {
    data: {
      posts: await response.json(),
    },
  }
}
