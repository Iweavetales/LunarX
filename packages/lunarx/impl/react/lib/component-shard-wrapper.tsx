import React, { useContext, useEffect, useState } from "react"
import { RootAppContext } from "./root-app-context"

export const ComponentShardWrapper = (props: { shardPath: string }) => {
  const appRouteContext = useContext(RootAppContext)
  const [error, setError] = useState<unknown | null>(null)
  const preparedComponent = appRouteContext.components[props.shardPath]

  useEffect(() => {
    if (!preparedComponent) {
      ;(async () => {
        try {
          const module = await appRouteContext.loader(props.shardPath)

          appRouteContext.registerComponentByShardPath(
            props.shardPath,
            module.default
          )
        } catch (e) {
          setError(e)
        }
      })()
    }
  }, [preparedComponent])

  const Component: React.FunctionComponent =
    preparedComponent || (() => <div> Not loaded yet </div>)
  if (error) {
    return <div>Shard Loading Error: {String(error)}</div>
  } else {
    return <Component />
  }
}
