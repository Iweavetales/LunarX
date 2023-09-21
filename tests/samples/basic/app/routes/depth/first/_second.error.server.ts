import { ErrorHandlerFunction } from "lunarx/server"

export const errorHandler: ErrorHandlerFunction<any, any> = async () => {
  console.log("error handling")

  return {
    data: {},
    error: {
      msg: "handled error by route error handler",
      statusCode: 512,
      redirect: "/",
    },
  }
}
