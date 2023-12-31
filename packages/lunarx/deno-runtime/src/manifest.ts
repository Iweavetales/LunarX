// export type MetaOutput = {
//   bytes: number;
//   inputs: {
//     [path: string]: {
//       bytesInOutput: number;
//     };
//   };
//   imports: {
//     path: string;
//     kind: string;
//   }[];
//   exports: string[];
//   entryPoint?: string;
// };
// export type ShardType = 'stylesheet' | 'javascript' | 'unknown';
// export type LunarJSManifest = {
//   moduleShards: {
//     [shardPath: string]: {
//       isEntry: boolean;
//       isChunk: boolean;
//       isServerSideShard: boolean;
//       serverSideOutputPath: string; // esm output 경로
//       clientSideOutputPath: string; // cjs output 경로
//       type: ShardType;
//     };
//   };
//   entryModules: {
//     [outputPath: string]: MetaOutput & {
//       shardPath: string;
//     };
//   };
//   chunkModules: {
//     [outputPath: string]: MetaOutput & {
//       shardPath: string;
//     };
//   };
// };

import { LunarJSManifest } from "../../lib/manifest.ts"

export function LoadManifest(path: string): LunarJSManifest {
  const text = Deno.readTextFileSync(path)

  const config = JSON.parse(text)

  return config
}
