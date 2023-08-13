export type Config = {
  js: {
    distDirectory: string;
    esmDirectory: string;
    cjsDirectory: string;
    esmMetaFilePath: string;
    cjsMetaFilePath: string;
    routesRoot: string;
  };
  publicServe: {
    port: string;
  };
  privateServe: {
    port: string;
  };
  production: boolean;

  build: {
    cjsTranspiler: 'swc' | 'babel';
    vendors?: string[];
  };
};
