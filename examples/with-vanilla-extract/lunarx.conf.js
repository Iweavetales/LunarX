const postcss = require("postcss")
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
    ],
    minify: true,
    obfuscate: true,
  },
}

module.exports = lunarConfig
