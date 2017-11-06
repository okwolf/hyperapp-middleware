export default function(updater) {
  return function(action) {
    return function(state, actions) {
      return function(data) {
        var update = updater({ name: action.name, data: data })
        var result = action(state, actions)
        var nextState = typeof result === "function" ? result(data) : result
        if (update) {
          var nextResult = update(state, actions, nextState)
          if (typeof nextResult === "function") {
            nextResult(function(nextResultState) {
              actions.update(nextResultState)
            })
          } else {
            return nextResult
          }
        } else {
          return nextState
        }
      }
    }
  }
}
