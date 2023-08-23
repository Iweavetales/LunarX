import { join } from "path"

export class PathHelper {
  static cwd = process.cwd()

  static GetDistFilePath(distPath: string): string {
    return join(PathHelper.cwd, distPath)
  }
}
