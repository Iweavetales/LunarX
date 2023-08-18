# Builder

## css module 에러 해결법
✘ [ERROR] Could not resolve "../pkg"

    node_modules/lightningcss/node/index.js:16:27:
      16 │   module.exports = require(`../pkg`);
         ╵     

lightningcss/node/index.js 파일에 `&& false` 이 부분 추가
```
if (process.env.CSS_TRANSFORMER_WASM && false ) {
module.exports = require(`../pkg`);
} ```