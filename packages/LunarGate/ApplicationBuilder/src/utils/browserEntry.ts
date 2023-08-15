import { BuiltShardInfo } from '../../../lib/Manifest';

export function CheckBrowserEntrySource(shardInfo: BuiltShardInfo): boolean {
  let entryPoint = shardInfo.entryPoint;
  /**
   * entry.browser.tsx will be used in reserved file name for Lunar framework
   */
  if (/\/entry\.browser\.(ts|js)x?$/.test(entryPoint)) {
    return true;
  }
  return false;
}
