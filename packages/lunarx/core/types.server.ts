import { ServerContext } from "./server-context"
import { DocumentSheet } from "./document-types"

export type EntryServerHandler = (
  context: ServerContext,
  documentSheet: DocumentSheet
) => Promise<string>
