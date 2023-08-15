export type LunarConfig = {
    js: {
        distDirectory: string;
        esmDirectory: string;
        cjsDirectory: string;
        esmMetaFilePath: string;
        cjsMetaFilePath: string;
        routesRoot: string;
    };

    build: {
        cjsTranspiler: 'swc' | 'babel';
        vendors?: string[];
        plugins?: any[];
        loaders?: Record<any, any>;
    };
}

export const defaultConfig: LunarConfig = {
    js:{
        distDirectory: './dist',
        esmDirectory: "./dist/esm/",
        cjsDirectory: "./dist/cjs/",
        esmMetaFilePath: "./dist/meta.esm.json",
        cjsMetaFilePath: "./dist/meta.cjs.json",
        routesRoot: "./app/routes",
    },

    build: {
        cjsTranspiler: "swc",
        vendors: [],
        plugins: [],
        loaders: {}
    }
}