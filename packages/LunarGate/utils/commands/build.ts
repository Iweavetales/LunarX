
export default async function Build(args: string[]) {
    console.log(args)

    let builder = require("../../dist/ApplicationBuilder/index.js").default;
    let buildContext = await builder()
    await buildContext.watch()
    console.log(builder)
}