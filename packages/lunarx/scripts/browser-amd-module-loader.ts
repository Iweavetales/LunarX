/**
 * browser-amd-module-loader.js
 * Asynchronous Define/Require pattern module loader
 * Authored by Seunghoon Han 2023
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const DEBUG = false

type ModuleUrlResolver = (moduleName: string) => string
type ModuleNameToURLHint =
  | {
      [moduleName: string]: string | null
    }
  | ModuleUrlResolver

type ModuleObjectFactory = (...deps: string[]) => any
type ModuleDefinition = {
  name: string
  deps: string[]
  moduleFactory: ModuleObjectFactory
}
// exported real module by moduleDefinition
type ModuleContent = any
;(function () {
  const moduleMap: { [absoluteModulePath: string]: ModuleDefinition } = {}
  const loadedModule: { [absoluteModulePath: string]: ModuleContent } = {}

  let subscriberIdCounter = 1
  const subscribers: {
    [id: number]: {
      listener: (moduleName: string) => void
      moduleName: string
    }
  } = {}

  function subscribeModuleLoad(
    modulePath: string,
    cb: (module: any) => void
  ): number {
    const id = subscriberIdCounter++

    subscribers[id] = { listener: cb, moduleName: modulePath }

    return id
  }
  function cancelSubscribeModuleLoad(id: number) {
    delete subscribers[id]
  }

  /**
   * Path resolver
   * @param base
   * @param target
   */
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

  function _define(
    moduleName: string,
    deps: string[],
    factory: ModuleObjectFactory
  ) {
    // DEBUG &&  console.log("Define", moduleName, deps)
    moduleMap[moduleName] = {
      name: moduleName,
      deps: deps,
      moduleFactory: factory,
    }

    for (const subscriberId in subscribers) {
      const subscriber = subscribers[subscriberId]
      if (subscriber.moduleName === moduleName) {
        subscriber.listener(moduleName)

        delete subscribers[subscriberId]
      }
    }
  }

  type ModuleNamesCallback = (
    moduleNames: string[],
    callback: () => any
  ) => void

  async function resolveModuleDependencyPaths(
    moduleMeta: ModuleDefinition
  ): Promise<any[]> {
    return moduleMeta.deps.map((subModuleName) => {
      if (subModuleName === "exports") {
        return "exports"
      } else if (subModuleName === "require") {
        return "require"
      } else {
        return resolvePath(moduleMeta.name, subModuleName)
      }
    })
  }
  async function unpackModuleDefinition(
    moduleDefinition: ModuleDefinition,
    nonce: string | null,
    moduleUrlHint: ModuleNameToURLHint
  ): Promise<any> {
    DEBUG &&
      console.log(
        "> unpack module definition",
        moduleDefinition.name,
        loadedModule
      )
    if (loadedModule[moduleDefinition.name]) {
      DEBUG &&
        console.log(
          "> present loaded module already",
          moduleDefinition.name,
          loadedModule[moduleDefinition.name]
        )
      return loadedModule[moduleDefinition.name]
    }

    const exportObject = {}
    const resolvedModuleDependencyPaths = await resolveModuleDependencyPaths(
      moduleDefinition
    )

    return await handleSubModules(
      resolvedModuleDependencyPaths,
      moduleDefinition,
      exportObject,
      nonce,
      moduleUrlHint
    )
  }

  async function handleSubModules(
    moduleDependencyPaths: any[],
    moduleMeta: ModuleDefinition,
    exportObject: any,
    nonce: string | null,
    moduleUrlHint: ModuleNameToURLHint
  ): Promise<any> {
    const loadedModulesBucket = await PromiseSerialMap(
      moduleDependencyPaths,
      (depPath, i) => {
        return new Promise((resolve, reject) => {
          if (depPath === "exports") {
            resolve(exportObject)
          } else if (depPath === "require") {
            resolve(createModuleNamesCallback(moduleMeta))
          } else {
            _require(
              [depPath],
              (requiredModules) => {
                resolve(requiredModules[0])
              },
              moduleMeta.name,
              nonce,
              moduleUrlHint
            )
          }
        })
      }
    )

    return finalizeModule(moduleMeta, loadedModulesBucket, exportObject)
  }

  function createModuleNamesCallback(
    moduleMeta: ModuleDefinition
  ): ModuleNamesCallback {
    return (moduleNames: string[], callback: () => any) =>
      _require(moduleNames, callback, moduleMeta.name, null, {})
  }

  function finalizeModule(
    moduleMeta: ModuleDefinition,
    loadedModules: any[],
    exportObject: any
  ): any {
    moduleMeta.moduleFactory(...loadedModules)
    loadedModule[moduleMeta.name] = exportObject
    DEBUG &&
      console.log(
        "> module content has been cached",
        moduleMeta.name,
        loadedModule
      )

    return exportObject
  }

  /**
   *
   * @param deps
   * @param _callback
   * @param _from 모듈 호출 위치
   */
  async function _require(
    deps: string[],
    _callback: ((modules: any[]) => void) | null,
    _from: string | null,
    nonce: string | null,
    moduleUrlHint: ModuleNameToURLHint
  ) {
    DEBUG && console.log("> required modules", deps, moduleMap)

    const retrievedModuleDefinitionList: ModuleDefinition[] = []

    for await (const moduleName of deps) {
      /**
       * _from 이 입력되면 모듈 내에서 모듈을 호출 했으므로
       * _from 기준으로 모듈의 절대경로를 보정 한다.
       */
      if (_from !== null) {
        const absoluteModulePath = resolvePath(_from, moduleName)
        const referencingModuleContent = moduleMap[absoluteModulePath]

        if (referencingModuleContent) {
          retrievedModuleDefinitionList.push(referencingModuleContent)
          continue
        }
      }

      if (moduleMap[moduleName]) {
        retrievedModuleDefinitionList.push(moduleMap[moduleName])
        continue
      }

      const moduleDefinitionFromRemote: ModuleDefinition = await new Promise(
        (resolve, reject) => {
          const moduleUrl =
            typeof moduleUrlHint === "function"
              ? moduleUrlHint(moduleName)
              : moduleUrlHint[moduleName] || moduleName

          const presentScriptTag = document.querySelector(
            `script[src='${moduleUrl}']`
          )
          if (!presentScriptTag) {
            const preloadedScript = document.createElement("script")
            DEBUG && console.log(`> Load module ${moduleName}`)
            preloadedScript.src = moduleUrl
            preloadedScript.nonce = nonce ?? ""

            /**
             * Will called listener when loaded module from remote has been defined.
             */
            const subscribingId = subscribeModuleLoad(moduleName, () => {
              DEBUG && console.log("> defined module", moduleMap, loadedModule)
              resolve(moduleMap[moduleName])
            })
            preloadedScript.onload = () => {
              DEBUG &&
                console.log("> onload module script", moduleMap, loadedModule)
            }
            preloadedScript.onerror = () => {
              cancelSubscribeModuleLoad(subscribingId)
              reject(`from:'${_from}' Module[${moduleName}] not found.`)
            }
            document.body.appendChild(preloadedScript)
          }
        }
      )

      retrievedModuleDefinitionList.push(moduleDefinitionFromRemote)
    }

    DEBUG &&
      console.log(
        "> retrieved module factories",
        deps,
        retrievedModuleDefinitionList
      )

    PromiseSerialMap(retrievedModuleDefinitionList, (moduleDef) => {
      return unpackModuleDefinition(moduleDef, nonce, moduleUrlHint)
    }).then((requiredModuleContents) => {
      _callback?.(requiredModuleContents)
    })
  }

  async function PromiseSerialMap<ItemType, ResultType>(
    items: ItemType[],
    processor: (item: ItemType, index: number) => Promise<ResultType>
  ) {
    const bucket: ResultType[] = new Array(items.length)
    let index = 0
    for await (const item of items) {
      bucket[index] = await processor(item, index)

      index++
    }
    return bucket
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.define = _define

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.require = _require
})()
