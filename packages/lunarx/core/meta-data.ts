import { PublicServerSideFetchResult } from "~/core/context"

export interface IMeta {
  name: string
  content: string
}

export type MetaDataGeneratorResult = {
  title?: string
  rawMetaList?: IMeta[]
}

export type MetaDataGenerator = (
  fetchedData: PublicServerSideFetchResult<any>
) => Promise<MetaDataGeneratorResult>
