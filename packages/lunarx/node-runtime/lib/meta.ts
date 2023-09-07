import { readFileSync } from "fs"

export type SourceMetaImport = {
  path: string
  kind: string
}

export type OutputChunkInfo = {
  bytes: number
  entryPoint: string
  imports: SourceMetaImport[]
  exports: string[]
  inputs: {
    [key: string]: {
      bytesInOutput: number
    }
  }
}

/**
 ESBuild 로 생성되는 meta 파일 내용
 */
export type SourceMetaDescription = {
  inputs: {
    [chunkName: string]: {
      bytes: number
      imports: SourceMetaImport[]
    }
  }

  outputs: { [chunkFileName: string]: OutputChunkInfo }
}

// func LoadMetaConfig(path string) (*SourceMetaDescription, error) {
// 	content, err := os.ReadFile(path)
// 	if err != nil {
// 		return nil, err
// 	}
// 	metaDesc := SourceMetaDescription{}
// 	err = json.Unmarshal(content, &metaDesc)
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	return &metaDesc, nil
// }
export function LoadMeta(path: string): SourceMetaDescription {
  const jsonText = readFileSync(path, "utf-8")

  return JSON.parse(jsonText)
}
