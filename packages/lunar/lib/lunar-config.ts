import { SupportingRuntime } from "./runtime"
export type LunarConfig = {
  js: {
    distDirectory: string
    esmDirectory: string
    cjsDirectory: string
    esmMetaFilePath: string
    cjsMetaFilePath: string
    routesRoot: string
  }

  build: {
    outDir: "dist" | string
    cjsTranspiler: "swc" | "babel"
    vendors?: string[]
    plugins?: any[]
    loaders?: Record<any, any>
    obfuscate?: boolean // Note: Obfuscation will impact decrease slight to performance.
    minify?: boolean
  }
  frontFramework: "solid" | "react"

  runtime: {
    type: SupportingRuntime
  }
}

export const defaultConfig: LunarConfig = {
  js: {
    distDirectory: "./dist",
    esmDirectory: "./dist/esm/",
    cjsDirectory: "./dist/cjs/",
    esmMetaFilePath: "./dist/meta.esm.json",
    cjsMetaFilePath: "./dist/meta.cjs.json",
    routesRoot: "./app/routes",
  },
  frontFramework: "react",

  build: {
    outDir: "dist",
    cjsTranspiler: "swc",
    vendors: [],
    plugins: [],
    loaders: {},
    obfuscate: false,
    minify: false,
  },

  runtime: {
    type: "node",
  },
}
