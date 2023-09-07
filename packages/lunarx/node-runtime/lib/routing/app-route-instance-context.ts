import { RawRouteInfoNode } from "~/core/manifest"
import { UniversalRouteInfoNode } from "~/core/document-types"
import { AppStructureContext } from "../client-app-structure"

export class AppRouteInstanceContext {
  #raw: RawRouteInfoNode[]
  #unv: UniversalRouteInfoNode[]
  #str: AppStructureContext
  constructor(
    rawRouteInfoNodeListRootToLeaf: RawRouteInfoNode[],
    universalRouteInfoNodeList: UniversalRouteInfoNode[],
    appStructureContext: AppStructureContext
  ) {
    this.#raw = rawRouteInfoNodeListRootToLeaf
    this.#unv = universalRouteInfoNodeList
    this.#str = appStructureContext
  }

  get rawRouteInfoNodeListRootToLeaf() {
    return this.#raw
  }

  get universalRouteInfoNodeList() {
    return this.#unv
  }

  get appStructureContext() {
    return this.#str
  }
}
