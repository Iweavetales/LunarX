
export function ReadJson<T>(path: string): T {
    const jsonText = Deno.readTextFileSync(path);

    const jsonObject = JSON.parse(jsonText);

    return jsonObject;
}