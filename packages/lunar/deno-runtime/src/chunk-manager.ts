import { OutputChunkInfo } from "./meta.ts"
import { ChunkFileName } from "./chunk.ts"

export type ChunkWrapper = {
  Info: OutputChunkInfo
  Data: string
}

export type ChunkFileMap = { [chunkFileName: ChunkFileName]: ChunkWrapper }
