import { existsSync, mkdirSync } from "fs"

export const ensureDirectoryExists = (path: string) => {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}
