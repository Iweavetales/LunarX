package main

import "C"
import (
	"SwiftSurface/src/ReactAppServerRuntime"
	"SwiftSurface/src/routes"
	"SwiftSurface/src/utils"
	"fmt"
	"github.com/gofiber/fiber/v2"
	"os"
)

func main() {
	config, err := utils.LoadConfig("./swift.yaml")
	if err != nil {
		panic(err)
	}

	appCtx := ReactAppServerRuntime.ReactAppRuntimeContext{}
	appCtx.Init()
	//val, err := appCtx.RunScript("import 'aa';", "print.js")

	//val, _ := appCtx.RunScript("print('foo')", "print.js")
	_, err = appCtx.RunScript("'aa'", "print.js")
	if err != nil {
		panic(err)
	}

	//sourceList := []string{}
	//err = filepath.Walk(config.Js.CJSDirectory, func(path string, info fs.FileInfo, err error) error {
	//	if err != nil {
	//		println("Failed read cjs files")
	//		return err
	//	}
	//
	//	// JS 파일만 모은다
	//	if !info.IsDir() {
	//		extension := filepath.Ext(path)
	//		if extension == ".js" {
	//			sourceList = append(sourceList, path)
	//		}
	//	}
	//	return nil
	//})
	//if err != nil {
	//	panic("Failed read cjs files")
	//}

	/**
	Meta 정보 로딩
	*/
	meta, err := ReactAppServerRuntime.LoadMetaConfig(config.Js.CJSMetaFilePath)
	if err != nil {
		println("Failed to read meta", err.Error())
	}

	/**
	ChunkFileMap 세팅
	*/
	chunkFileMap := ReactAppServerRuntime.ChunkFileMap{}
	for chunkFileName, chunkInfo := range meta.Outputs {
		bytes, err := os.ReadFile(string(chunkFileName))
		if err != nil {
			panic(fmt.Errorf("Failed read chunk data : " + err.Error()))
		}

		chunkFileMap[chunkFileName] = ReactAppServerRuntime.ChunkWrapper{
			Info: chunkInfo, // Meta 의 output 청크 정보
			Data: bytes,     // 청크 소스 데이터
		}
	}

	/**
	Webapp 생성
	*/
	webapp := ReactAppServerRuntime.WebAppStructure{
		ChunkFileMap: chunkFileMap,
		Meta:         *meta,
		AppRuntime:   &appCtx,
	}
	/**
	저장된 Meta 로 엔트리목록을 만든다
	*/
	webapp.CollectEntries(config.Js.RoutesRoot)
	webapp.ConstructModuleFactoriesIntoRuntime() /* 로드된 모듈들을 런타임에 생성한다 */

	/**
	HTTP 서버 생성
	*/
	app := fiber.New()

	/**
	엔트리 목록으로 실제 http 라우팅 규칙을 생성한다
	*/
	routes := routes.BuildWebAppRoutes(app, &webapp)

	print(routes)
	//app.Get("*", func(c *fiber.Ctx) error {
	//	return c.SendString("Hello, World!")
	//})

	app.Listen(":3005")
}
