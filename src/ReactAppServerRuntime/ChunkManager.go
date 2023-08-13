package ReactAppServerRuntime

type ChunkWrapper struct {
	Info OutputChunkInfo
	Data []byte
}

type ChunkFileMap = map[ChunkFileName]ChunkWrapper
