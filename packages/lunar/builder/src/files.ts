import * as fs from "fs"
import * as path from "path"

/**
 * 재귀함수로 해당 디렉토리의 모든 파일경로를 추출한다
 * @param dirPath
 * @param arrayOfFiles
 * @returns {*[]}
 */
export const getAllFiles = function (dirPath: string, arrayOfFiles: string[]) {
  const files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file))
    }
  })

  return arrayOfFiles
}
