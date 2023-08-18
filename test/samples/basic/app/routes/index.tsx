import React from 'react';
//
import { Outlet } from 'react-router';
import { Link } from 'lunargate-test-helloworld3/router';
// import { useServerFetches } from '../swift2/serverFetches';

export default function IndexPage() {
  // const serverFetches = useServerFetches();

  return (
    <div>
      LunarGate Index
      <Link href={'/about'}>To About</Link>
      <Outlet />
    </div>
  );
}
