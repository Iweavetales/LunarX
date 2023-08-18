import { LunarContext } from 'lunargate-test-helloworld3/lunarContext';
export async function serverFetches(ctx: LunarContext) {
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
