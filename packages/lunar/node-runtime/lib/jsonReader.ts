import { readFileSync } from "fs"

export function ReadJson<T>(path: string): T {
  const jsonText = readFileSync(path, "utf-8")

  const jsonObject = JSON.parse(jsonText)

  return jsonObject
}
