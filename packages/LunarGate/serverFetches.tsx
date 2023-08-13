import React, { createContext, useContext } from 'react';
import { SwiftRouterContext } from './Router';

export type RouteFetchResult = {
  data?: any;
  error?: {
    id: string;
  };
};

type RouteDataValues = {
  result?: RouteFetchResult;
};
const ServerFetchesContext = createContext<RouteDataValues>({});

export const ServerFetchesProvider = function (props: {
  // result: RouteFetchResult;
  children?: React.ReactNode;
  dataKey: string;
}) {
  const routeCtx = useContext(SwiftRouterContext);
  const serverFetchesResult = routeCtx.routeDataMap[props.dataKey];

  if (serverFetchesResult?.error) {
    return <div> Data Error : {serverFetchesResult.id}</div>;
  }

  return (
    <ServerFetchesContext.Provider value={{ result: serverFetchesResult }}>
      {props.children}
    </ServerFetchesContext.Provider>
  );
};

export const useServerFetches = function (): RouteFetchResult | null {
  const ctx = useContext(ServerFetchesContext);

  return ctx.result || null;
};

export function NewServerFetchError(
  internalError: Error,
  loggingData: { [key: string]: any },
  publicMessage?: string,
  errorCode?: number,
) {
  return {
    serverFetchCustomError: true,
    publicMessage: publicMessage,
    errorCode: errorCode,
    internalError: internalError,
    internalData: loggingData,
  };
}
