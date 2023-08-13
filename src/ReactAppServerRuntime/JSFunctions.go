package ReactAppServerRuntime

import (
	"fmt"
	v8 "rogchap.com/v8go"
)

func (appCtx *ReactAppRuntimeContext) JSFnPrint(info *v8.FunctionCallbackInfo) *v8.Value {
	fmt.Println("Called print() %v", info.Args()) // when the JS function is called this Go callback will execute

	str := string("new value return")
	returnValue, err := v8.NewValue(appCtx.iso, str)
	if err != nil {
		fmt.Println("Error")
	}

	return returnValue // you can return a value back to the JS caller if required
}

/*
*
모듈 Require 함수
*/
func (appCtx *ReactAppRuntimeContext) JSFnRequire(info *v8.FunctionCallbackInfo) *v8.Value {
	fmt.Println("Called print() %v", info.Args()) // when the JS function is called this Go callback will execute

	str := string("new value return")
	returnValue, err := v8.NewValue(appCtx.iso, str)
	if err != nil {
		fmt.Println("Error")
	}

	return returnValue // you can return a value back to the JS caller if required
}
