import React, { useContext, useEffect, useState } from "react"
import { RootAppContext } from "./root-app-context"
import { Params, useParams } from "react-router"

export const ComponentShardWrapper = (props: { shardPath: string }) => {
  const rootAppContextValue = useContext(RootAppContext)
  const params = useParams()
  const [error, setError] = useState<unknown | null>(null)
  const preparedComponent = rootAppContextValue.components[props.shardPath]
  // console.log("rootAppContextValue.components", rootAppContextValue.components)
  useEffect(() => {
    if (!preparedComponent) {
      ;(async () => {
        try {
          const module = await rootAppContextValue.loader(props.shardPath)

          rootAppContextValue.registerComponentByShardPath(
            props.shardPath,
            module.default
          )
        } catch (e) {
          // console.log("eee", e)
          setError(e)
        }
      })()
    }
  }, [preparedComponent])

  const Component: React.FunctionComponent<{
    params: Params<string>
  }> = preparedComponent || (() => <div> Not loaded yet </div>)

  if (error) {
    return <div>Shard Loading Error: {String(error)}</div>
  } else {
    return <Component params={params} />
  }
}
