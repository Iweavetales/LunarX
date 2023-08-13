package ReactAppServerRuntime

import (
	"fmt"
	"github.com/fatih/color"
	"hash/fnv"
	"path/filepath"
	"regexp"
)

type RoutableEntryPointName string

type EntryPointInfo struct {
	ChunkName ChunkFileName
}

type WebAppStructure struct {
	/**
	살제 서비스되는 페이지 라우터이름기준이며
	Entries 기준으로 fiber 라우팅 규칙이 생성된다
	index.js
	post/[id].js
	post/write.js
	*/
	RoutableEntries map[RoutableEntryPointName]EntryPointInfo
	/**
	라우팅 상관없이 엔트리 포인트로 지정된 모듈 목록
	map[엔트리포인트 값]엔트리청크정보
	*/
	ModuleEntries map[string]EntryPointInfo

	ChunkFileMap ChunkFileMap
	Meta         SourceMetaDescription

	AppRuntime *ReactAppRuntimeContext
}

// CollectEntries /**
// HTTP 라우팅이 가능한 엔트리 목록을 추출
// relativeRoutesRoot : App Root 베이스의 routesRoot 상대경로
// ex) relativeRoutesRoot == "./app/routes"
func (webApp *WebAppStructure) CollectEntries(relativeRoutesRoot string) {
	webApp.RoutableEntries = map[RoutableEntryPointName]EntryPointInfo{}
	webApp.ModuleEntries = map[string]EntryPointInfo{}

	green := color.New(color.FgHiGreen).PrintfFunc()
	blue := color.New(color.FgBlue).PrintfFunc()

	/**
	알파벳으로 시작하거나 [ 로 시작하는 경로를 매치한다
	[로 시작하는 경우는 파라미터 처리가된 Entry Point 이다.
	그 밖에 "../" "./" 로 시작하는 경우는 무시한다
	왜냐하면 ../ ./ 로 시작된 경로들은 routeRoot 로 시작되지 않은 엔트리 포인트들이며 개별 모듈이므로 RoutableEntryPoint가 아니다.
	*/
	routableEntryMatchExp, err := regexp.Compile("^([A-Za-z0-9]|\\[)")
	if err != nil {
		panic("Failed to make regexp for match routable entry name")
	}
	for chunkFileName, chunkInfo := range webApp.Meta.Outputs {
		if chunkInfo.EntryPoint != "" {

			/**
			EntryPoint 를 fiber 에서 routing 할 수 있는 엔트리 경로로 변환
			EntryPoint 를 routesRoot 상대좌표로 변환한다
			app/routes/index.js -> index.js
			app/routes/blog/index.js -> blog/index.js
			*/
			entryPointRelative, err := filepath.Rel(relativeRoutesRoot, chunkInfo.EntryPoint)
			if err != nil {
				panic("Failed to convert entryPoint to relative EntryPoint")
			}

			/**
			routable Entry Point 경로만 RoutableEntries 멤버로 추가
			*/
			if routableEntryMatchExp.MatchString(entryPointRelative) {
				webApp.RoutableEntries[RoutableEntryPointName(entryPointRelative)] = EntryPointInfo{
					ChunkName: chunkFileName, // 엔트리포인트에 해당하는 chunk 파일 경로
				}
				green("Found routable entry point \t[%s]\t->\t[%s]\n", entryPointRelative, chunkFileName)
			} else {
				blue("Found non routable entry point \t[%s]\t->\t[%s]\n", entryPointRelative, chunkFileName)
			}

			/**
			모든 엔트리 청크를 ModuleEntries 에 등록
			*/
			webApp.ModuleEntries[chunkInfo.EntryPoint] = EntryPointInfo{
				ChunkName: chunkFileName, // 엔트리포인트에 해당하는 chunk 파일 경로
			}
		}
	}
}

func hash(s string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(s))
	return h.Sum32()
}

func (webApp *WebAppStructure) ConstructModuleFactoriesIntoRuntime() {

	green := color.New(color.FgHiGreen).PrintfFunc()
	blue := color.New(color.FgBlue).PrintfFunc()
	//require("../../../chunk-4XRJ2YDJ.js");
	requireReplacer, err := regexp.Compile(`require\("((\./)?(\.\./)*([A-Za-z0-9.-]+/?)*\.js)"\);`)
	if err != nil {
		panic(fmt.Errorf("failed to compile regexp for replace module require path :%s", err.Error()))
	}
	for chunkFileName, chunk := range webApp.ChunkFileMap {
		println("ChunkFile:", chunkFileName)

		_, filename := filepath.Split(string(chunkFileName))
		ext := filepath.Ext(filename)

		// js 파일만 모듈로 등록
		if ext == ".js" {
			//println(chunkFileName, "=>", dir, filename)
			moduleFunctionName := fmt.Sprintf("f%d", hash(filename))

			data := string(chunk.Data)
			//pathList := requireReplacer.FindAllString(data, -1)

			/**
			모듈 참조 경로가 절대경로로 변경된 코드 데이터
			*/
			dataResolvedRequirePath := requireReplacer.ReplaceAllStringFunc(data, func(matched string) string {

				// require("../../../chunk-4XRJ2YDJ.js"); 에서 ../../../chunk-4XRJ2YDJ.js 부분만 추출한다
				subMatched := requireReplacer.FindStringSubmatch(matched)
				// 0 번째 요소는 매치가 발생한 문자열 전체
				// 1 번째 요소는 제일 첫번째 캡쳐
				if len(subMatched) >= 2 {
					relativeRequirePath := subMatched[1] // require 문 에서 상대경로 문자열만 추출
					absolutePath := filepath.Join(filepath.Dir(string(chunkFileName)), relativeRequirePath)

					blue("relative require(path) resolved to absolute:[%v] -> [%v]\n", relativeRequirePath, absolutePath)

					return fmt.Sprintf(`require("%s");`, absolutePath)
				}

				panic(fmt.Errorf("failed to resolve relative path param of require() to absolute. Couldn't match path"))

				return matched
			})

			/**
			각 모듈 청크들을 js runtime 에 등록한다
			*/
			_, err := webApp.AppRuntime.RunScript(fmt.Sprintf(`
				__Register__Module__('%s',function %s(exports){ 
					%s
				});
			`, chunkFileName, moduleFunctionName, dataResolvedRequirePath), string(chunkFileName))
			green("Module Registered named[%s]\n", chunkFileName)
			if err != nil {
				err = fmt.Errorf("failed to construct module factory : %s", err.Error())

				panic(err.Error())
			}
		}

	}

}
