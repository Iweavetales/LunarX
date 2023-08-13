package ReactAppServerRuntime

import (
	"fmt"
	"os"
	v8 "rogchap.com/v8go"
)

type ReactAppRuntimeContext struct {
	iso          *v8.Isolate
	rootContext  *v8.Context
	globalObject *v8.ObjectTemplate
}

func (appCtx *ReactAppRuntimeContext) Init() {
	appCtx.iso = v8.NewIsolate()                           // create a new VM
	appCtx.globalObject = v8.NewObjectTemplate(appCtx.iso) // a template that represents a JS Object
	appCtx.rootContext = appCtx.SpawnContext()

	/**
	기본 어플리케이션 동작 환경 스크립트
	*/
	_, err := appCtx.RunScript(`
	var __ModuleRegistry__ = {};
	const require = (modulePath) => {
		print("called module["+modulePath+"]");

		let moduleFactory = __ModuleRegistry__[modulePath];
		
		let exports = {};		
		let module = moduleFactory(exports)
		return exports;
	}

	function __Register__Module__(path, moduleFactory){
		//let exports = {};		
		//let module = moduleFactory(exports)
		 
		//print(stdout);
		__ModuleRegistry__[path] = moduleFactory
		//__ModuleRegistry__[path] = exports
	}  
`, "_base_.js")

	if err != nil {
		panic(err)
	}

	appCtx.LoaderHelperScripts()

}

func (appCtx *ReactAppRuntimeContext) LoaderHelperScripts() {
	content, err := os.ReadFile("./ApplicationBuilder/src/ssrHelpers/TextEncoding.js")
	//content, err := os.ReadFile("./ApplicationBuilder/dist/ssrHelpers.js")
	if err != nil {
		panic(fmt.Errorf("failed to read SSR Helper script check ApplicationBuilder build-helpers:%s\n", err.Error()))
	}

	val, err := appCtx.RunScript(fmt.Sprintf(`
		(() => {
			var module = {
				exports:{}
			}; 
			%s; 
		})() 
	`, content), "ssr-helpers.js")
	if err != nil {
		panic(fmt.Errorf("failed to execute ssr-helper.js :%s\n", err.Error()))
	}
	fmt.Printf("Helper script ret:%v\n", val)
}

func (appCtx *ReactAppRuntimeContext) SpawnContext() *v8.Context {
	consoleObject := v8.NewObjectTemplate(appCtx.iso)
	consoleObject.Set("log", v8.NewFunctionTemplate(appCtx.iso, appCtx.JSFnPrint))
	consoleObject.Set("error", v8.NewFunctionTemplate(appCtx.iso, appCtx.JSFnPrint))
	consoleObject.Set("warn", v8.NewFunctionTemplate(appCtx.iso, appCtx.JSFnPrint))
	consoleObject.Set("info", v8.NewFunctionTemplate(appCtx.iso, appCtx.JSFnPrint))
	consoleObject.Set("trace", v8.NewFunctionTemplate(appCtx.iso, appCtx.JSFnPrint))
	consoleObject.Set("dir", v8.NewFunctionTemplate(appCtx.iso, appCtx.JSFnPrint))

	// Set functions
	appCtx.globalObject.Set("print", v8.NewFunctionTemplate(appCtx.iso, appCtx.JSFnPrint))
	appCtx.globalObject.Set("console2", consoleObject)

	// Set objects

	return v8.NewContext(appCtx.iso, appCtx.globalObject) // creates a new V8 context with a new Isolate aka VM
}

func (appCtx *ReactAppRuntimeContext) RunScript(source string, origin string) (*v8.Value, error) {
	val, err := appCtx.rootContext.RunScript(source, origin)

	return val, err
}

func (appCtx *ReactAppRuntimeContext) RunIsolateScript(source string, origin string) (*v8.Value, error) {
	isolatedCtx := v8.NewContext(appCtx.iso) // New VM

	val, err := isolatedCtx.RunScript(source, origin)

	return val, err
}
