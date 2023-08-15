
export default async function Build(args: string[]) {
    console.log(args)

    let builder = require("../../dist/ApplicationBuilder/index.js").default;
    let buildContext = await builder(() => {

        console.log("built")
    })
    await buildContext.rebuild()
    console.log(builder)
}