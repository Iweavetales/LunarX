export default async function Dev(args: string[]) {
    console.log(args)

    let builder = require("../../dist/ApplicationBuilder/index.js").default;
    let buildContext = await builder(() => {
        // built
        console.log("built")
    })
    await buildContext.watch()
    console.log(builder)
}