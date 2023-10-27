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
    sourceMap?: boolean
  }
  frontFramework: "solid" | "react"

  runtime: {
    target: SupportingRuntime
    compressSSRData?: boolean // If this is true will compress server-side fetch data with lz-string
  }

  etc: {
    deleteBootstrapScriptAfterBoot: boolean
  }

  // debug: {
  //   debugLoader: boolean
  // }
}

export const baseConfig: LunarConfig = {
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
    sourceMap: true,
  },

  runtime: {
    target: "node",
    compressSSRData: false,
  },

  etc: {
    deleteBootstrapScriptAfterBoot: true,
  },
}

export function ExtendConfig(
  original: LunarConfig,
  override: LunarConfig
): LunarConfig {
  return {
    ...original,
    ...override,
    js: {
      ...original.js,
      ...override.js,
    },
    build: {
      ...original.build,
      ...override.build,

      vendors: [
        ...(original.build?.vendors ?? []),
        ...(override.build?.vendors ?? []),
      ],
      plugins: [
        ...(original.build?.plugins ?? []),
        ...(override.build?.plugins ?? []),
      ],
      loaders: {
        ...(original.build?.loaders ?? {}),
        ...(override.build?.loaders ?? {}),
      },
    },

    runtime: {
      ...original.runtime,
      ...override.runtime,
    },

    etc: {
      ...original.etc,
      ...override.etc,
    },
  }
}
