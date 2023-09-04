export function match<ValueType>(value: ValueType) {
  const withList: (() => boolean)[] = []
  const withFunction = function <EvaluateResult>(
    evaluate: (value: ValueType) => EvaluateResult,
    matching: (evalResult: EvaluateResult) => boolean,
    task: (value: ValueType, evalResult: EvaluateResult) => void
  ) {
    withList.push(() => {
      const evaluateResult = evaluate(value)
      if (matching(evaluateResult)) {
        task(value, evaluateResult)
        return true
      }
      return false
    })
    return obj
  }

  const obj = {
    with: withFunction,
    exhaustive: () => {
      for (const withFunction of withList) {
        withFunction()
      }
    },
    once: () => {
      for (const withFunction of withList) {
        if (withFunction()) {
          return
        }
      }
    },
  }
  return obj
}
