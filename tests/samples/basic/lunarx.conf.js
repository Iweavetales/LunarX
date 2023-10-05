const { vanillaExtractPlugin } = require("@vanilla-extract/esbuild-plugin")
const postcss = require("postcss")
const { sassPlugin } = require("esbuild-sass-plugin")
const cssModulesPlugin = require("esbuild-css-modules-plugin")
/** @type {import('lunarx/config').LunarConfig} */
const lunarConfig = {
  build: {
    minify: false,
    plugins: [
      vanillaExtractPlugin({
        // configuration
        postcss,
        identifiers: process.env.NODE_ENV === "production" ? "short" : "debug",
      }),
      sassPlugin(),
      cssModulesPlugin(),
    ],
  },
  etc: {
    deleteBootstrapScriptAfterBoot: false,
  },

  runtime: {
    compressSSRData: true,
  },
}

module.exports = lunarConfig
