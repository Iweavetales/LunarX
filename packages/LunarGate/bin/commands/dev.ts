
export default async function Dev(options: Record<any, any>) {
    console.log(options)

    let createBuildContext = require("../../dist/ApplicationBuilder/index.js").createBuildContext;
    let buildContext = await createBuildContext(() => {
        // built
        console.log("built")
    })
    await buildContext.watch()
    console.log(buildContext)
}