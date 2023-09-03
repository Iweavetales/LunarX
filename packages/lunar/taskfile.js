const esbuild = require("esbuild")
const ts = require("typescript")

// export async function bin(task, opts){
//
// }
module.exports = {
  *builder(task, opts) {
    yield esbuild.build({
      entryPoints: ["builder/src/index.ts"],
      outfile: "dist/builder/index.js",
      bundle: true,
      platform: "node",
      external: ["@swc", "esbuild"],
      sourcemap: "external",
      loader: {
        ".node": "file",
      },
    })
  },

  *nodeRuntime(task, opts) {
    yield esbuild.build({
      entryPoints: ["node-runtime/index.ts"],
      outfile: "dist/node-runtime/node-server.js",
      bundle: true,
      platform: "node",
      sourcemap: "external",
      loader: {
        ".node": "file",
      },
    })
  },

  *compileTs(task) {
    // Compile with tsconfig.json

    const projectDir = "." // Current directory
    const configPath = ts.findConfigFile(
      projectDir,
      ts.sys.fileExists,
      "tsconfig.json"
    )

    const readConfigHost = {
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
      useCaseSensitiveFileNames: true,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      onUnRecoverableConfigFileDiagnostic: () => {},
    }

    const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
      configPath,
      {},
      readConfigHost
    )

    if (!parsedCommandLine) {
      throw new Error('Could not parse "tsconfig.json".')
    }

    const host = ts.createCompilerHost(parsedCommandLine.options, true)
    const program = ts.createProgram({
      rootNames: parsedCommandLine.fileNames,
      options: parsedCommandLine.options,
      host: host,
    })
    const emitResult = program.emit()

    const allDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics)

    allDiagnostics.forEach((diagnostic) => {
      if (diagnostic.file) {
        const { line, character } = ts.getLineAndCharacterOfPosition(
          diagnostic.file,
          diagnostic.start
        )
        const message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          "\n"
        )
        console.error(
          `${diagnostic.file.fileName} (${line + 1},${
            character + 1
          }): ${message}`
        )
      } else {
        console.error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
        )
      }
    })

    const exitCode = emitResult.emitSkipped ? 1 : 0
    if (exitCode === 0) {
      console.log("Compilation successful!")
    } else {
      console.error("Compilation failed.")
    }
  },

  *bin(task) {
    yield esbuild.build({
      entryPoints: ["bin/lunar.ts"],
      outfile: "dist/bin/lunar",
      bundle: true,
      platform: "node",
      external: ["@swc", "esbuild"],
    })
  },

  *prebuild(task) {
    yield task.parallel(["builder", "compileTs", "nodeRuntime"])
  },

  *release(task) {
    yield task.serial(["prebuild", "bin"])
  },
}
// export async function builder(task, opts){
//     // "build:builder": "npm run escape-lightningcss-error &&
//     // esbuild builder/src/index.ts
//     // --bundle
//     // --platform=node
//     // --outfile=builder/dist/builder.js
//     // --external:esbuild
//     // --external:@swc
//     // --sourcemap=external
//     // --loader:.node=file",
//
//     await esbuild.build({
//         entryPoints: ["builder/src/index.ts"],
//         outfile: "dist/builder/index.js",
//         bundle: true,
//         platform: "node",
//         external:['@swc', 'esbuild'],
//         sourcemap:"external",
//         loader:{
//             ".node": "file"
//         }
//     })
// }
