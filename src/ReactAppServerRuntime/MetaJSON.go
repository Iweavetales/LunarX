package ReactAppServerRuntime

import (
	"encoding/json"
	"os"
)

type SourceMetaImport struct {
	Path string `json:"path"`
	Kind string `json:"kind"`
}

type OutputChunkInfo struct {
	Bytes      int64              `json:"bytes"`
	EntryPoint string             `json:"entryPoint"`
	Imports    []SourceMetaImport `json:"imports"`
	Exports    []string           `json:"exports"`
	Inputs     map[string]struct {
		BytesInOutput int64 `json:"bytesInOutput"`
	}
}

/*
*
ESBuild 로 생성되는 meta 파일 내용
*/
type SourceMetaDescription struct {
	Inputs map[string]struct {
		Bytes   int64              `json:"bytes"`
		Imports []SourceMetaImport `json:"imports"`
	} `json:"inputs"`

	Outputs map[ChunkFileName]OutputChunkInfo `json:"outputs"`
}

func LoadMetaConfig(path string) (*SourceMetaDescription, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	metaDesc := SourceMetaDescription{}
	err = json.Unmarshal(content, &metaDesc)
	if err != nil {
		return nil, err
	}

	return &metaDesc, nil
}
