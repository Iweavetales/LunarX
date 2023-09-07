import { ServerErrorHandler } from "lunarx/server"

export const errorHandler: ServerErrorHandler<any> = async (
  ctx,
  thrownError
): ReturnType<ServerErrorHandler<any>> => {
  //
  return {
    data: {},
    error: {
      msg: "handled error by root error handler",
    },
  }
}
