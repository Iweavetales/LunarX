import { LunarContext } from "./lunarContext"
import { DocumentSheet } from "./DocumentTypes"

export type EntryServerHandler = (
  context: LunarContext,
  documentSheet: DocumentSheet,
  LunarJSApp: any
) => Promise<string>
