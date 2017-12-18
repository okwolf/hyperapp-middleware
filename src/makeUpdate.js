export default function(update) {
  return function(action) {
    return function(data) {
      return function(state, actions) {
        var result = action(data)(state, actions)
        result = update(state, { name: action.name, data: data }, result)
        return result
      }
    }
  }
}
