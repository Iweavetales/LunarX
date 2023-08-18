import chalk from "chalk"

function getFileName(filepath: string): string {
  const pathTokens = filepath.replace(/\\/g, "/").split("/") // 디렉토리를 제외한 파일명
  const filename = pathTokens[pathTokens.length - 1]

  return filename
}

/**
 * 파일 확장자 배열 반환
 * @name ExtensionList
 * @type function
 * @param filepath
 * @constructor
 */
export function ExtensionList(filename: string): string[] {
  return filename.split(".").slice(1) // 첫번째 (.) 이후 확장자를 배열로 반환
}

function ThisIsServerSideShard(filePath: string): boolean {
  const filename = getFileName(filePath)
  const extensions = ExtensionList(filename)
  const extensionCount = extensions.length

  /**
   * filename 이 server.js 면 서버사이드 스크립트로 간주 한다.
   *
   * 아래의 샤드를 거르기 위해서 추가 하였다.
   *  "react-dom/server.js"
   *  "react-router-dom/server.js"
   */
  if (filename === "server.js") {
    console.log(
      chalk.yellow(`File '${filePath}' is classified to server side shard.`)
    )
    return true
  }

  /**
   * 확장자가 2개 이상인 경우
   */
  if (extensionCount >= 2) {
    const secondExtensionFromLast = extensions[extensionCount - 2] // 끝에서 두번째 확장자

    if (secondExtensionFromLast === "server") {
      // 파일명이 *.server.* 로 끝나면 서버사이드 모듈 이므로 클라이언트 소스 트랜스폼에서 제외 시킨다
      console.log(
        chalk.yellow(`File '${filePath}' is classified to server side shard.`)
      )
      return true
    }
  }

  return false
}

type InputSourcesOfPathOfOutputs = {
  [path: string]: {
    bytesInOutput: number
  }
}

/**
 * @name DetermineServerSideShard
 * @type function
 * @description 빌드된 스크립트가 서버사이드 Shard 인지 분석하는 함수
 * @param entryFilepath
 * @param inputSources
 * @constructor
 */
export function DetermineServerSideShard(
  entryFilepath: string | null,
  inputSources: InputSourcesOfPathOfOutputs
): {
  isServerSideShard: boolean
  // 애매한 서버사이드 스크립트
  // entryPoint 에 해당하는 소스 파일에서 서버사이드 스크립트를 임포트 하고 있는 경우 애매한 서버사이드 스크립트로 간주한다
  isAmbiguousServerSideSource: boolean
  // entryPoint 에 입력된 서버사이드 스크립트 패스 배열
  inputServerSideSources: string[]
} {
  if (entryFilepath) {
    if (ThisIsServerSideShard(entryFilepath)) {
      return {
        isServerSideShard: true,
        isAmbiguousServerSideSource: false,
        inputServerSideSources: [],
      }
    }
  }

  /**
   * entryFilepath 가 server side shard 는 아니지만
   * shard 를 구성하는 input 중 server side shard 가 있는지 체크
   */
  const inputSourceFileNames = Object.keys(inputSources)
  const includedServerSideScripts: string[] = []
  for (let idx = 0; idx < inputSourceFileNames.length; idx++) {
    const sourceFileName = inputSourceFileNames[idx]
    if (ThisIsServerSideShard(sourceFileName)) {
      // console.warn(
      //   // chalk.redBright('Skipped server side script. But may mixed client/server side script  '),
      //   sourceFileName,
      // );

      includedServerSideScripts.push(sourceFileName)
    }
  }

  /**
   * server side source 가 포함되어 있다면 애매한 server side shard 로 간주하여 결과 반환
   */
  if (includedServerSideScripts.length > 0) {
    return {
      isServerSideShard: true,
      isAmbiguousServerSideSource: true,
      inputServerSideSources: includedServerSideScripts,
    }
  }

  /**
   * server side shard ㄱ ㅏ아님
   */
  return {
    isServerSideShard: false,
    isAmbiguousServerSideSource: false,
    inputServerSideSources: [],
  }
}
