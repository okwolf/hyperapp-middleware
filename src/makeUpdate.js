export default function(updater) {
  return function(action) {
    return function(state, actions, data) {
      var update = updater({ name: action.name, data: data })
      var result = action(state, actions, data)
      return typeof result === "function"
        ? function(updateState) {
            return result(function(nextResult) {
              return updateState(
                update ? update(state, actions, nextResult) : nextResult
              )
            })
          }
        : update ? update(state, actions, result) : result
    }
  }
}
