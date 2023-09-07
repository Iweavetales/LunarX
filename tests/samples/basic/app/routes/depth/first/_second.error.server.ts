import { ServerErrorHandler } from "lunarx/dist/core/server-context"

export const errorHandler: ServerErrorHandler<any> = () => {
  console.log("error handling")

  return {
    data: {},
    error: {
      msg: "handled error by route error handler",
    },
  }
}
