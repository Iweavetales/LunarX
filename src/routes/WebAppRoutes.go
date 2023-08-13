package routes

import (
	"SwiftSurface/src/ReactAppServerRuntime"
	"fmt"
	"github.com/fatih/color"
	"github.com/gofiber/fiber/v2"
	"regexp"
	v8 "rogchap.com/v8go"
	"strings"
)

type WebAppRoute struct {
	webApp               *ReactAppServerRuntime.WebAppStructure
	matchPattern         string
	entryInfo            ReactAppServerRuntime.EntryPointInfo
	originEntryPointName ReactAppServerRuntime.RoutableEntryPointName // 원본 EntryPoint 파일패스
	handler              fiber.Handler
}

func (r *WebAppRoute) Register(app *fiber.App) {
	r.handler = func(c *fiber.Ctx) error {
		scriptData := r.webApp.ChunkFileMap[r.entryInfo.ChunkName]

		reactModuleChunkName := r.webApp.GetReactChunkName()
		reactDomServerModuleChunkName := r.webApp.GetReactDomServerChunkName()

		fmt.Printf("%v, %v ,%s\n", reactDomServerModuleChunkName, reactModuleChunkName, c.OriginalURL())
		val, err := r.webApp.AppRuntime.RunScript(fmt.Sprintf(`
			
				(() => { 
					let page = require("%s");
					let react = require("%s").default;
					let reactDomServer = require("%s").default;
					let reactRouterDomServer = require("%s").default;
					let StaticRouter = reactRouterDomServer.StaticRouter;
					  
					return reactDomServer.renderToString(
						react.createElement(StaticRouter,{location:"%s"},[
							react.createElement('div')
						])
					)
				})();
				`,
			r.entryInfo.ChunkName,
			reactModuleChunkName,
			reactDomServerModuleChunkName,
			r.webApp.GetReactRouterDomServerChunkName(),
			c.OriginalURL(),
		), "main.js")

		if err != nil {
			//fmt.Printf("Script Error:%v\n", err.Error())

			e := err.(*v8.JSError)    // JavaScript errors will be returned as the JSError struct
			fmt.Println(e.Message)    // the message of the exception thrown
			fmt.Println(e.Location)   // the filename, line number and the column where the error occured
			fmt.Println(e.StackTrace) // the full stack trace of the error, if available

			fmt.Printf("javascript error: %v", e)        // will format the standard error message
			fmt.Printf("javascript stack trace: %+v", e) // will format the full error stack trace

			return c.Status(fiber.StatusInternalServerError).SendString(fmt.Sprintf(`
			%s <br/>
			Error: %s
`, scriptData.Data, err.Error()))
		}
		//ret, err := c.Status(fiber.StatusOK).SendString(fmt.Sprintf("%s", val))
		//fmt.Printf("WriteString Ref:%d\n", ret)
		return c.Status(fiber.StatusOK).SendString(fmt.Sprintf(`
			%s <br/>
			Result: %s
`, scriptData.Data, val))
	}

	app.Get(r.matchPattern, r.handler)
}

func BuildWebAppRoutes(fiberApp *fiber.App, webApp *ReactAppServerRuntime.WebAppStructure) map[string]WebAppRoute {
	routes := make(map[string]WebAppRoute, len(webApp.RoutableEntries))

	green := color.New(color.FgHiGreen).PrintfFunc()

	/**
	경로의 최종 파일명이 "index" 라면 / 로 변경하는 정규식
	*/
	indexResolveRegExp, err := regexp.Compile("(^index$)|/index$")
	if err != nil {
		panic("Failed to compile regexp for buildWebRoute index resolver")
	}

	for routablePoint, entryPointInfo := range webApp.RoutableEntries {

		/**
		Route 파일 확장자 .tsx 를 제거 한다
		*/
		tsxExtension := ".tsx"
		routePattern := strings.TrimSuffix(string(routablePoint), tsxExtension)

		/**
		마지막 경로가 "index" 로 끝나면 index 를 제거하고 / 에 매치되도록 변경한다.
		*/
		routePattern = indexResolveRegExp.ReplaceAllString(routePattern, "/")

		webAppRoute := WebAppRoute{
			webApp:               webApp,
			matchPattern:         routePattern,
			entryInfo:            entryPointInfo,
			originEntryPointName: routablePoint,
		}

		/**
		라우팅 등록
		*/
		webAppRoute.Register(fiberApp)

		routes[routePattern] = webAppRoute
		green("Route:[%s]\n", routePattern)

	}

	return routes
}
