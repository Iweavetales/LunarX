import { RawRouteInfoNodeMap } from "~/core/manifest"
import { HTTPVersion, Instance as RouterInstance } from "find-my-way"
import { AppStructureContext } from "./client-app-structure"
import { serveStatic } from "./routing/serve-static"
import { serveLoader } from "./routing/serve-loader"
import { serveShards } from "./routing/serve-shards"
import { GenerateRoutesByAppRoutePattern } from "./routing/generate-routes-by-app-route-pattern"
import { AppRouteInstanceContext } from "./routing/app-route-instance-context"
import { serveServerSideFetching } from "./routing/serve-server-side-fetching"
import { serveServerSideRendering } from "./routing/serve-server-side-rendering"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Router = require("find-my-way")

export function BuildRoutes(
  rawRouteInfoNodeMap: RawRouteInfoNodeMap,
  appContext: AppStructureContext
): RouterInstance<HTTPVersion.V1> {
  const rootRouter = Router()

  /**
   * Provide static files
   */
  rootRouter.on("GET", "/static/*", serveStatic)

  /**
   * Provide client-side shards loader
   */
  rootRouter.on("GET", "/_/s/loader.js", serveLoader, appContext)

  /**
   * Provide client shards
   */
  rootRouter.on("GET", "/_/s/*", serveShards, appContext)

  /**
   * Provide service pages
   */
  const routePatterns = Object.keys(rawRouteInfoNodeMap)
  routePatterns.forEach((routePattern) => {
    GenerateRoutesByAppRoutePattern(
      rootRouter,
      appContext,
      rawRouteInfoNodeMap,
      routePattern
    )
  })

  // GhostRoutePatternContext
  const appRouteInstanceContext = new AppRouteInstanceContext(
    [],
    [],
    appContext
  )

  /**
   * server-side-fetch 404
   */
  rootRouter.on(
    "GET", // @Todo: change to post
    "/_/r/*",
    serveServerSideFetching,
    appRouteInstanceContext
  )

  /**
   * 404
   */
  rootRouter.on("GET", "/*", serveServerSideRendering, appRouteInstanceContext)

  return rootRouter
}
