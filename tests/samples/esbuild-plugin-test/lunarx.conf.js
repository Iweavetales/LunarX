const postcss = require("postcss")
const cssModulesPlugin = require("esbuild-css-modules-plugin")
const { sassPlugin } = require("esbuild-sass-plugin")
const { vanillaExtractPlugin } = require("@vanilla-extract/esbuild-plugin")

/** @type {import('lunarx/config').LunarConfig } */
const lunarConfig = {
  build: {
    plugins: [
      vanillaExtractPlugin({
        // configuration
        postcss,
        identifiers: process.env.NODE_ENV === "production" ? "short" : "debug",
      }),
      sassPlugin(),
      cssModulesPlugin(),
    ],
    minify: true,
    obfuscate: true,
  },
}

module.exports = lunarConfig
