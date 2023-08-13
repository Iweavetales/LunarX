export function IsDevelopment(): boolean {
	const nodeEnv = Deno.env.get('NODE_ENV');
	return nodeEnv === 'development';
}
