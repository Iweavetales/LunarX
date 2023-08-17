import {join} from "path";
import {SupportingRuntime} from "./runtime";
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
        outDir: 'dist' | string;
        cjsTranspiler: 'swc' | 'babel';
        vendors?: string[];
        plugins?: any[];
        loaders?: Record<any, any>;
    };

    runtime: {
        type: SupportingRuntime
    }
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
        outDir: 'dist',
        cjsTranspiler: "swc",
        vendors: [],
        plugins: [],
        loaders: {}
    },

    runtime: {
        type: "node"
    }
}
