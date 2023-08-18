import { SwiftRenderer } from 'lunargate-test-helloworld3/lunarApp';
import React from 'react';
import { useServerFetches } from 'lunargate-test-helloworld3/serverFetches';
export default () => {
  const fetches = useServerFetches();

  console.log('fetches', fetches);
  return <SwiftRenderer />;
};
