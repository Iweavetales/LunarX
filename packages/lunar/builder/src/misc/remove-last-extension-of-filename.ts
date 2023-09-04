const regexp = /\.[a-zA-Z0-9]+$/
export function removeLastExtensionOfFilename(path: string) {
  return path.replace(regexp, "")
}
