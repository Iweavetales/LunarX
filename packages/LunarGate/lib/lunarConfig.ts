export type LunarConfig = {
    js: {
        distDirectory: string;
        esmDirectory: string;
        cjsDirectory: string;
        esmMetaFilePath: string;
        cjsMetaFilePath: string;
        routesRoot: string;
    };
    publicServe: {
        port: string | number;
    };
    privateServe: {
        port: string | number;
    };
    production: boolean;

    build: {
        cjsTranspiler: 'swc' | 'babel';
        vendors?: string[];
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

    publicServe: {
        port: 3001
    },

    privateServe: {
        port: 3002
    },

    production: false,

    build: {
        cjsTranspiler: "swc",
        vendors: []
    }
}