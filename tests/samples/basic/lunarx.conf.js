/** @type {import('lunarx/config').LunarConfig} */
const lunarConfig = {
  build: {
    minify: false,
  },
  etc: {
    deleteBootstrapScriptAfterBoot: false,
  },

  runtime: {
    compressSSRData: true,
  },
}

module.exports = lunarConfig
