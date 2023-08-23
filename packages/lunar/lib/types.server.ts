import { LunarContext } from "./lunar-context"
import { DocumentSheet } from "./document-types"

export type EntryServerHandler = (
  context: LunarContext,
  documentSheet: DocumentSheet,
  LunarJSApp: any
) => Promise<string>
