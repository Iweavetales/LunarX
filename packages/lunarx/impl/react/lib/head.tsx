// import React from "react"
// import withSideEffect from "react-side-effect"
//
// export interface IMeta {
//   name: string
//   content: string
// }
//
// function reducePropsToState(propsList: object[]) {
//   //
//   console.log("reducePropsToState", propsList)
// }
// function handleClientStateChange(state: any) {
//   //
//   console.log("handleClientStateChange", state)
// }
// function mapStateOnServer(state: any) {
//   //
//   console.log("mapStateOnServer", state)
//
//   return {}
// }
// const NullComponent = () => null
// const SideEffectComponent = withSideEffect(
//   reducePropsToState,
//   handleClientStateChange,
//   mapStateOnServer
// )(NullComponent)
//
// const HeadElements = (SideEffectComponent: React.ComponentType<any>) => {
//   return {
//     peek: SideEffectComponent.peek,
//     rewind: SideEffectComponent.rewind,
//     Meta: (props: IMeta) => {
//       return <SideEffectComponent tag={"meta"} {...props} />
//     },
//   }
// }
// const HeadFeatures = HeadElements(SideEffectComponent)
//
// export const Meta = HeadFeatures.Meta
// export const peek = HeadFeatures.peek
// export const rewind = HeadFeatures.rewind
