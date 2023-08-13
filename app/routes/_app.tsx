import { SwiftRenderer } from '../../packages/LunarGate/SwiftApp';
import React from 'react';
import { useServerFetches } from '../../packages/LunarGate/serverFetches';
export default () => {
  const fetches = useServerFetches();

  console.log('fetches', fetches);
  return <SwiftRenderer />;
};
