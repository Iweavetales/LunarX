import { OutputChunkInfo } from "./meta"
import { ChunkFileName } from "./chunk"

export type ChunkWrapper = {
  Info: OutputChunkInfo
  Data: string
}

export type ChunkFileMap = { [chunkFileName: ChunkFileName]: ChunkWrapper }
