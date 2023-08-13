import { OutputChunkInfo } from './Meta.ts';
import { ChunkFileName } from './Chunk.ts';

export type ChunkWrapper = {
	Info: OutputChunkInfo;
	Data: string;
};

export type ChunkFileMap = { [chunkFileName: ChunkFileName]: ChunkWrapper };
