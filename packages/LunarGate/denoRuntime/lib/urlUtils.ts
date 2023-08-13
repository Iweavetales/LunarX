export function GetUrlPath(url: string) {
	const urlPath = url.replace(/^https?:\/\/[a-zA-Z0-9-.]+(:?[0-9]+?)\//, '/');
	return urlPath;
}
