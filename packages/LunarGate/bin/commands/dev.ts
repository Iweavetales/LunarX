
export default async function Dev(options: Record<any, any>) {
    console.log(options)

    const createBuildContext = require("../../dist/ApplicationBuilder/index.js").createBuildContext;
    const buildContext = await createBuildContext(() => {
        // built
        console.log("built")
    })
    await buildContext.watch()
    console.log(buildContext)
}