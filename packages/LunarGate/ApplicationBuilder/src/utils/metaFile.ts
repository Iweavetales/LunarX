import { Metafile } from 'esbuild';

export enum DiffStatus {
  ADDED,
  DELETED,
}
type DiffResult = {
  [outputFile: string]: {
    status: DiffStatus;
  };
};
export const DiffMetaOutput = (oldMeta: Metafile, newMeta: Metafile): DiffResult => {
  let oldOutputKeys = Object.keys(oldMeta.outputs);
  let newOutputKeys = Object.keys(newMeta.outputs);

  let oldOutputKeysLength = oldOutputKeys.length;
  let newOutputKeysLength = newOutputKeys.length;

  let diffRet: DiffResult = {};

  let key: string = '';
  for (let i = 0; i < oldOutputKeysLength; i++) {
    key = oldOutputKeys[i];

    if (!newMeta.outputs[key]) {
      diffRet[key] = {
        status: DiffStatus.DELETED,
      };
    }
  }

  for (let i = 0; i < newOutputKeysLength; i++) {
    key = newOutputKeys[i];

    if (!oldMeta.outputs[key]) {
      diffRet[key] = {
        status: DiffStatus.ADDED,
      };
    }
  }

  return diffRet;
};
