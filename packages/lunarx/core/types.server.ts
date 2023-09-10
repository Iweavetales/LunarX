import { ServerContext } from "./server-context"
import { DocumentSheet } from "./document-types"
import { ServerResponse } from "http"

export type EntryServerHandler = (
  context: ServerContext,
  documentSheet: DocumentSheet,
  res: ServerResponse
) => Promise<string | boolean>
