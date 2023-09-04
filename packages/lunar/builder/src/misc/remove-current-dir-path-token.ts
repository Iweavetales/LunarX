const regexp = /^\.\//
/**
 * Remove a token './' at first of path.
 * @param path
 */
export function removeCurrentDirPathToken(path: string) {
  return path.replace(regexp, "")
}
