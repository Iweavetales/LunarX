import { ServerContext } from "lunarx/context"

export async function serverFetches(ctx: ServerContext) {
  return {
    data: {
      // articles: jsonResponse.data,
    },
  }
}
