import * as ts from "typescript"

function transform(context: ts.TransformationContext) {
  return (sourceFile: ts.SourceFile) => {
    function visitor(node: ts.Node): ts.Node {
      if (ts.isTypeLiteralNode(node)) {
        return ts.createTypeLiteralNode([
          ts.createPropertySignature(
            undefined,
            "a",
            undefined,
            ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            undefined
          ),
        ])
      }
      return ts.visitEachChild(node, visitor, context)
    }

    return ts.visitNode(sourceFile, visitor)
  }
}

export default function (program: ts.Program) {
  return {
    before: [transform],
  }
}
