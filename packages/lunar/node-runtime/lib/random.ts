import { randomBytes } from "crypto"

export function GenerateRandomBytes(length: number): string {
  const buffer = randomBytes(length)
  return buffer.toString("hex")
}
