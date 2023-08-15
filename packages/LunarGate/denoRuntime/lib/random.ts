import { crypto } from "./deps.ts"

export function GenerateRandomBytes(length: number): string {
	let arr = new Uint8Array(length);
	arr = crypto.getRandomValues(arr);

	const bytes = String.fromCharCode(...arr);

	return bytes;
}
