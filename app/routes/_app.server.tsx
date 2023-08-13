import { SwiftContext } from '../../packages/LunarGate/context';
export async function serverFetches(ctx: SwiftContext) {
  // /client-session/info

  return {
    data: {
      ENV: {
        NODE_ENV: 'development',
      },
      userAgent: ctx.requestHeaders.get('user-agent'),
    },
  };
}
