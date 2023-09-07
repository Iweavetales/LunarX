# Builder

## Solution for css module error 
✘ [ERROR] Could not resolve "../pkg"

    node_modules/lightningcss/node/index.js:16:27:
      16 │   module.exports = require(`../pkg`);
         ╵     

 ADD `&& false` at lightningcss/node/index.js
```
if (process.env.CSS_TRANSFORMER_WASM && false ) {
module.exports = require(`../pkg`);
} ```