import { rmSync } from 'fs';

export function ClearDirectory(dir: string) {
  try {
    let err = rmSync(dir, { force: true, recursive: true });
    console.log('deleted', dir, err);
  } catch (e) {
    console.error(e);
  }
}
