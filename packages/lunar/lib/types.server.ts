import { ServerContext } from "./lunar-context"
import { DocumentSheet } from "./document-types"

export type EntryServerHandler = (
  context: ServerContext,
  documentSheet: DocumentSheet,
  LunarJSApp: any
) => Promise<string>
