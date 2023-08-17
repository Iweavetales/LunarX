import { transformFileSync } from '@babel/core';
// @ts-ignore
import pluginTransformModulesAmd from '@babel/plugin-transform-modules-amd';

import chalk from 'chalk';
// import swc from '@swc/core';
const swc = require('@swc/core');

export function TranspileForBrowser(
  cjsTranspiler: 'babel' | 'swc',
  outputShardPath: string,
  normalizedRelativePath: string,
  esmSourceMapFile: Buffer | null,
) {
  // console.log('swc', swc.transformFileSync, esmSourceMapFile);

  if (cjsTranspiler === 'swc') {
    console.log(chalk.bgBlue('BUILD with SWC'));
    const result = swc.transformFileSync(outputShardPath, {
      // Some options cannot be specified in .swcrc
      filename: normalizedRelativePath,
      sourceMaps: process.env.NODE_ENV === 'production' ? false : true,
      inputSourceMap: process.env.NODE_ENV === 'production' ? false : (esmSourceMapFile || '{}').toString(),
      // Input files are treated as module by default.
      isModule: true,
      minify: process.env.NODE_ENV === 'production',

      module: {
        type: 'amd',
        moduleId: normalizedRelativePath,
      },

      // jsc: {
      //   experimental: {
      //     plugins: [
      //       [
      //         '@swc/plugin-styled-components',
      //         {
      //           displayName: true,
      //           ssr: true,
      //         },
      //       ],
      //     ],
      //   },
      // },
    });

    return result;
  } else {
    // cjsTranspiler === "babel"
    console.log(chalk.bgBlue('BUILD with Babel'));

    const compiled = transformFileSync(outputShardPath, {
      plugins: [
        pluginTransformModulesAmd,
        [
          'babel-plugin-styled-components',
          {
            ssr: true,
          },
        ],
      ], // amd 형식으로 빌드

      // https://npmdoc.github.io/node-npmdoc-babel-core/build/apidoc.html#apidoc.element.babel-core.File.prototype.getModuleName
      moduleId: normalizedRelativePath, // amd 모듈로 전환 할 때 모듈명을 부여하기 위해 moduleId 를 지정

      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['last 2 versions'],
              // "node":"node 12.0"
            },
          },
        ],
      ],

      minified: process.env.NODE_ENV === 'production',
      sourceMaps: process.env.NODE_ENV === 'production' ? false : true,
      inputSourceMap: JSON.parse((esmSourceMapFile || '{}').toString()),
    });

    return { code: compiled?.code, map: JSON.stringify(compiled?.map) };
  }
}
