import { head } from "lodash"
export type HeaderMap = Map<string, string | string[]>
export type HeaderObject = {
  [key: string]: undefined | string | string[]
}
export class HTTPHeaders {
  headers: HeaderMap

  constructor() {
    this.headers = new Map<string, string | string[]>()
  }

  asMap(): HeaderMap {
    return this.headers
  }

  asObject(): HeaderObject {
    const headerObj: HeaderObject = {}
    const entries = this.headers.entries()
    for (let it = entries.next(); it.value; it = entries.next()) {
      headerObj[it.value[0]] = it.value[1]
    }
    return headerObj
  }

  append(k: string, v: string | string[] | null): void {
    if (!v) return // If null or empty, no operation is performed

    const key = k.toLowerCase() // Headers are case-insensitive
    const existingValue = this.headers.get(key)

    if (existingValue) {
      // If the header already exists, append the new value(s)
      if (Array.isArray(existingValue)) {
        if (Array.isArray(v)) {
          this.headers.set(key, [...existingValue, ...v])
        } else {
          this.headers.set(key, [...existingValue, v])
        }
      } else {
        if (Array.isArray(v)) {
          this.headers.set(key, [existingValue, ...v])
        } else {
          this.headers.set(key, [existingValue, v])
        }
      }
    } else {
      // If the header does not exist, create it with the provided value(s)
      this.headers.set(key, v)
    }
  }

  remove(k: string): void {
    const key = k.toLowerCase() // Headers are case-insensitive
    this.headers.delete(key)
  }

  get(k: string): string | string[] | null {
    const key = k.toLowerCase() // Headers are case-insensitive
    return this.headers.get(key) || null
  }

  has(k: string): boolean {
    const key = k.toLowerCase() // Headers are case-insensitive
    return this.headers.has(key)
  }
}
