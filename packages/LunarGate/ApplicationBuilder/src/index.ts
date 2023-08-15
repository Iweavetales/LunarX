'use strict';

import { ClearDirectory } from './utils/clearDirectory';
import esbuild, { BuildContext } from 'esbuild';
import { join, relative, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
// import cssModulesPlugin from 'esbuild-css-modules-plugin';
// import chalk from 'chalk';
// const { vanillaExtractPlugin } = require('@vanilla-extract/esbuild-plugin');
const postcss = require('postcss');
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { getAllFiles } from './utils/files';
import esbuildBabelPlugin from './utils/esbuild-babel-plugin';
import { Config } from './utils/config';
import { collectDistLibSources } from './utils/collectDistLibSources';
const file = readFileSync('./swift.yaml', 'utf8');

const config: Config = parse(file);

ClearDirectory(config.js.distDirectory);

const cwd = process.cwd();
console.log('Lunar builder cwd', cwd, __dirname);
const appDirectory = join(cwd, './app');
const absoluteESMDistDirectory = join(cwd, config.js.esmDirectory);
const absoluteCJSDistDirectory = join(cwd, config.js.cjsDirectory);
const absoluteESMMetafilePath = join(cwd, config.js.esmMetaFilePath);
const absoluteCJSMetafilePath = join(cwd, config.js.cjsMetaFilePath);
const routeDirectory = join(appDirectory, './routes');

// Lunar Library directory
const libDirectory = resolve(__dirname, '../../dist/lib'); // swift-nest-platform 라이브러리 디렉토리
console.log('__dirname', __dirname, resolve(__dirname, '../../', './lib'));
if (!existsSync(absoluteESMDistDirectory)) {
  mkdirSync(absoluteESMDistDirectory, {
    recursive: true,
  });
}

if (!existsSync(absoluteCJSDistDirectory)) {
  mkdirSync(absoluteCJSDistDirectory, {
    recursive: true,
  });
}

async function BuildReusableBuilder(): Promise<BuildContext> {
  /**
   * Make route file list
   */
  let dirtyRouteFiles: any = []; // 필터링 되지않은(dirty) 모든 라우트 디렉토리 내의 파일들
  getAllFiles(routeDirectory, dirtyRouteFiles);
  /**
   * 라우트 디렉토리의 .tsx 확장자를 가진 파일만 필터링 한다
   */
  let filteredRouteFiles = dirtyRouteFiles
    .filter((filename: string) => /\.tsx/.test(filename))
    .map((filename: string) => relative(cwd, filename));

  console.log('routeFiles:', filteredRouteFiles);

  // let dirtyLibFiles: string[] = [];
  let libSources = collectDistLibSources(libDirectory);

  // libFiles
  // let libFiles = dirtyLibFiles.filter(filename => /\.tsx/.test(filename)).map(filename => relative(cwd, filename));
  console.log('lib files:', libSources);

  /**
   * lightningcss 모듈의
   * if (process.env.CSS_TRANSFORMER_WASM  ) {
   *   module.exports = require(`../pkg`);
   * }
   * cssModulesPlugin 에러를 방지 하기 위해 process.env.CSS_TRANSFORMER_WASM 를 빈값으로 설정
   */
  // process.env.CSS_TRANSFORMER_WASM = '';
  console.log('process.env', process.env);

  return await esbuild.context({
    entryPoints: [
      ...libSources,
      ...filteredRouteFiles,
      // 'react',
      // 'react-dom',
      // 'react-dom/server',
      // 'react-router-dom/server',
      ...(config.build.vendors || []),
    ],

    /**
     * React JSX 파일의 React 전역 참조를 해결
     */
    // inject: [join(libDirectory, 'react-shim.js')],
    // entryPoints: {
    //   react: 'react',
    //   'react-dom': 'react-dom',
    //   'react-dom-server': 'react-dom/server',
    //   'react-router-dom-server': 'react-router-dom/server',
    //
    //   'styled-components': 'styled-components',
    // },
    // jsx: 'transform',
    // jsxFactory: 'h',
    minify: process.env.NODE_ENV === 'production' ? true : false,
    entryNames: process.env.NODE_ENV === 'production' ? '[hash]' : '[dir]/[name]-[hash]',
    chunkNames: process.env.NODE_ENV === 'production' ? '[hash]' : '[name]-[hash]',
    // minifySyntax: true,
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,
    bundle: true,
    outdir: absoluteESMDistDirectory,
    format: 'esm',
    target: [],
    // outExtension: { '.js': '.mjs' }, // esm 모듈은 mjs 로
    splitting: true,
    // external:["react","react-dom"],
    // watch: true,
    // incremental: true,
    metafile: true,
    // write: false,
    treeShaking: true,
    // watch: true,
    loader: {
      '.ttf': 'file',
      '.woff2': 'file',
      '.woff': 'file',
      '.otf': 'file',
      '.eot': 'file',
    },
    plugins: [
      esbuildBabelPlugin(config, {
        distDirectoryPath: config.js.distDirectory,
        cjsDirectory: config.js.cjsDirectory,
        esmDirectory: config.js.esmDirectory,
        absoluteCJSMetafilePath: absoluteCJSMetafilePath,
        absoluteESMMetafilePath: absoluteESMMetafilePath,
        runtimeServerPort: config.privateServe.port,
      }),
    ],
  });
}

// (async function main() {
//   console.log('ENV =', process.env.NODE_ENV);
//
//   console.log(appDirectory, absoluteESMDistDirectory);
//   let buildContext = await BuildReusableBuilder();
//   console.log('watching');
//   await buildContext.watch();
// })();
export default BuildReusableBuilder;
