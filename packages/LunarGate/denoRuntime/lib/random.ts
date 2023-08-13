import { crypto } from 'https://deno.land/std@0.105.0/crypto/mod.ts?s=crypto';

export function GenerateRandomBytes(length: number): string {
	let arr = new Uint8Array(length);
	arr = crypto.getRandomValues(arr);

	const bytes = String.fromCharCode(...arr);

	return bytes;
}
