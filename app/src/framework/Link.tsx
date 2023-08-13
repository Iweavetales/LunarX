// import _Link from 'next/link';
import { Link as SwiftRouterLink } from '../../../packages/LunarGate/Router';
import React from 'react';

export const Link = (props: { href: string; children: React.ReactNode; className?: string }) => (
  <SwiftRouterLink href={props.href} className={props.className}>
    {props.children}
  </SwiftRouterLink>
);
