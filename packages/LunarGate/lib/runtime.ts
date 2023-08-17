
export type SupportingRuntime = "deno" | "node"


export type RuntimeOptions = {
    js: {
        distDirectory: string;
        esmDirectory: string;
        cjsDirectory: string;
        esmMetaFilePath: string;
        cjsMetaFilePath: string;
        routesRoot: string;
    };

    type: SupportingRuntime,
};