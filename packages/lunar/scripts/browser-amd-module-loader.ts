/**
 * browser-amd-module-loader.js
 *
 * 브라우저 상에서 샤드 스크립트를 로드하고 제공 하는 스크립트
 */
type RequireFunction = (deps: string[]) => any
type ModuleFactory = (...deps: string[]) => any
type ModuleContent = {
  name: string
  deps: string[]
  moduleFactory: ModuleFactory
}
;(function () {
  const moduleMap: { [absoluteModulePath: string]: ModuleContent } = {}
  const loadedModule: { [absoluteModulePath: string]: any } = {}

  function resolvePath(base: string, target: string) {
    let editing = base

    let trackingFilename = ""
    let dots = ""
    const targetPathLength = target.length
    for (let i = 0; i < targetPathLength; i++) {
      const c = target.charAt(i)

      trackingFilename += c

      if (c === ".") {
        if (dots.length > 0) {
          dots = ".."
        } else {
          dots = "."
        }
      } else if (c === "/") {
        if (dots.length === 1) {
          let editingPathLength: number
          let lastChar: string

          for (;;) {
            editingPathLength = editing.length
            lastChar = editing.charAt(editingPathLength - 1)
            // 편집중인 경로 문자열이 비었거나 제일 마지막 문자가 디렉토리("/") 라면 현재 위치("./")로 수정하는 작업을 끝낸다.
            if (lastChar === "" || lastChar === "/") {
              break
            }

            editing = editing.slice(0, editingPathLength - 1)
          }
        } else if (dots.length === 2) {
          let slashBackCount = 0
          let editingPathLength: number
          let lastChar: string
          for (;;) {
            editingPathLength = editing.length
            lastChar = editing.charAt(editingPathLength - 1)
            // 편집중인 경로 문자열이 비었거나 제일 마지막 문자가 디렉토리("/") 라면 현재 위치("./")로 수정하는 작업을 끝낸다.
            if (lastChar === "" || lastChar === "/") {
              slashBackCount++

              // 슬래시("/") 뒤로 간 횟수가 1번이면 현재 디렉토리고
              // 뒤로 간 횟수가 2번 이면 상위 디렉토리로 이동이 완료되었으므로 수정작업 완료
              if (slashBackCount > 1) {
                break
              }
            }

            editing = editing.slice(0, editingPathLength - 1)
          }
        } else if (dots.length === 0) {
          editing += trackingFilename
        }

        /**
         * "/" 가 등장 한다면 지금까지 트래킹된 파일문자열을 모두 리셋한다
         */
        dots = ""
        trackingFilename = ""
      }
    }

    editing += trackingFilename

    return editing
  }

  function _define(moduleName: string, deps: string[], factory: ModuleFactory) {
    console.log("shard define", moduleName)
    moduleMap[moduleName] = {
      name: moduleName,
      deps: deps,
      moduleFactory: factory,
    }

    console.log("module map", moduleMap)
  }

  /**
   * 배열의 요소 중에 undefined 가 있는지 검사 합니다
   * @param arr
   */
  function HasArrayUndefinedElement(arr: any[]): boolean {
    const len = arr.length
    for (let i = 0; i < len; i++) {
      if (arr[i] === undefined) {
        return true
      }
    }

    return false
  }

  type ModuleMeta = {
    name: string
    deps: string[]
  }
  function moduleCall(
    moduleMeta: ModuleMeta,
    _callback: (module: ModuleContent) => void
  ) {
    console.log("shard called", moduleMeta.name, moduleMeta)
    const deps = moduleMeta.deps
    const moduleName = moduleMeta.name

    if (loadedModule[moduleMeta.name]) {
      console.log("cached module", moduleMeta.name, moduleMeta)
      _callback(loadedModule[moduleMeta.name])
      return
    }

    const targetModuleContents = deps.map((depModuleName) => {
      if (depModuleName === "exports") {
        return depModuleName
      } else if (depModuleName === "require") {
        return depModuleName
      } else {
        const absoluteModulePath = resolvePath(moduleName, depModuleName)
        const referencingModuleContent = moduleMap[absoluteModulePath]

        if (referencingModuleContent) {
          return referencingModuleContent
        }

        throw new Error(`Module[${moduleName}] not found.`)
      }
    })
    const loadedModules = new Array(deps.length)

    const exportObject = {}
    let hasSubModuleCall = false
    targetModuleContents.forEach((content: any, i: number) => {
      if (content === "exports") {
        loadedModules[i] = exportObject
      } else if (content === "require") {
        /**
         * 모듈 내에서 사용된 require 는 모듈의 위치 기준으로 상대 경로로 호출 되기 때문에
         * 호출한 모듈의 경로를 입력한 함수로 전달
         * @param moduleNames
         * @param callback
         */
        loadedModules[i] = (moduleNames: string[], callback: () => any) =>
          _require(moduleNames, callback, moduleMeta.name)
      } else {
        hasSubModuleCall = true

        moduleCall(content, (module: any) => {
          loadedModules[i] = module

          /**
           * 모든 모듈이 로드 완료 되었는지 체크
           */
          if (HasArrayUndefinedElement(loadedModules) === false) {
            /**
             * 모듈을 가져 온다
             */
            moduleMeta.moduleFactory(...loadedModules)
            // 모듈 캐시 저장
            loadedModule[moduleMeta.name] = exportObject
            // 모듈 반환
            _callback(exportObject)
          }
        })
      }
    })

    // 서브 모듈 호출이 없다면 즉시 모듈 반환 콜백 호출
    if (hasSubModuleCall === false) {
      moduleMeta.moduleFactory(...loadedModules)
      // 모듈 캐시 저장
      loadedModule[moduleMeta.name] = exportObject
      // 모듈 반환
      _callback(exportObject)
    }
  }

  /**
   *
   * @param deps
   * @param _callback
   * @param _from 모듈 호출 위치
   */
  function _require(
    deps: string[],
    _callback: (modules: any[]) => any,
    _from: string | null = null
  ) {
    const loadedModules = new Array(deps.length)

    const targetModuleContents = deps.map((moduleName) => {
      /**
       * _from 이 입력되면 모듈 내에서 모듈을 호출 했으므로
       * _from 기준으로 모듈의 절대경로를 보정 한다.
       */
      if (_from !== null) {
        const absoluteModulePath = resolvePath(_from, moduleName)
        const referencingModuleContent = moduleMap[absoluteModulePath]

        if (referencingModuleContent) {
          return referencingModuleContent
        }
      }

      if (moduleMap[moduleName]) {
        return moduleMap[moduleName]
      }

      throw new Error(`${_from}: Module[${moduleName}] not found.`)
    })

    targetModuleContents.forEach((content, copyIndex) => {
      moduleCall(content, (module) => {
        loadedModules[copyIndex] = module

        if (HasArrayUndefinedElement(loadedModules) === false) {
          _callback(loadedModules)
        }
      })
    })
    // for(let i =0; i < deps.length; i++ ){
    //   let copyIndex = i
    //   let moduleContent = moduleMap[deps[i]];
    //
    //   moduleCall(moduleContent, (module) => {
    //     loadedModules[copyIndex] = module
    //     console.log('module loaded', moduleContent.name, loadedModules)
    //
    //     if( IsArrayHasUndefinedElement(loadedModules) === false ){
    //       _callback(loadedModules)
    //     }
    //   })
    // }
  }

  window.define = _define
  window.require = _require
})()
