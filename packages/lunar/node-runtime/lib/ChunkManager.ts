import { OutputChunkInfo } from "./Meta"
import { ChunkFileName } from "./Chunk"

export type ChunkWrapper = {
  Info: OutputChunkInfo
  Data: string
}

export type ChunkFileMap = { [chunkFileName: ChunkFileName]: ChunkWrapper }
