import { Metafile } from "esbuild"

export enum DiffStatus {
  ADDED,
  DELETED,
}
export type DiffResult = {
  status: DiffStatus
}
export type DiffResults = {
  [outputFile: string]: DiffResult
}
export const DiffMetaOutput = (
  oldMeta: Metafile,
  newMeta: Metafile
): DiffResults => {
  const oldOutputKeys = Object.keys(oldMeta.outputs)
  const newOutputKeys = Object.keys(newMeta.outputs)

  const oldOutputKeysLength = oldOutputKeys.length
  const newOutputKeysLength = newOutputKeys.length

  const diffRet: DiffResults = {}

  let key = ""
  for (let i = 0; i < oldOutputKeysLength; i++) {
    key = oldOutputKeys[i]

    if (!newMeta.outputs[key]) {
      diffRet[key] = {
        status: DiffStatus.DELETED,
      }
    }
  }

  for (let i = 0; i < newOutputKeysLength; i++) {
    key = newOutputKeys[i]

    if (!oldMeta.outputs[key]) {
      diffRet[key] = {
        status: DiffStatus.ADDED,
      }
    }
  }

  return diffRet
}
