import { BuiltShardInfo } from '../../lib/Manifest';

export function CheckBrowserEntrySource(shardInfo: BuiltShardInfo): boolean {
  const entryPoint = shardInfo.entryPoint;
  /**
   * entry.browser.tsx will be used in reserved file name for Lunar framework
   */
  if (entryPoint && /\/entry\.browser\.(ts|js)x?$/.test(entryPoint)) {
    return true;
  }
  return false;
}
