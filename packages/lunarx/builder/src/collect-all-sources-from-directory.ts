import { readdirSync, statSync } from "fs"
import { join } from "path"

export function collectAllSourcesFromDirectory(libPath: string): string[] {
  const files = readdirSync(libPath)

  let librarySources: string[] = []

  files.forEach(function (file) {
    if (statSync(libPath + "/" + file).isDirectory()) {
      librarySources = librarySources.concat(
        collectAllSourcesFromDirectory(libPath + "/" + file)
      )
    } else {
      if (/.*\.js$/.test(file)) {
        librarySources.push(join(libPath, "/", file))
      }
    }
  })

  return librarySources
}
