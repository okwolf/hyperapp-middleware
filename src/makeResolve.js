export default function(resolver) {
  return function(action) {
    return function(state, actions, data) {
      var resolve = resolver({ name: action.name, data: data })
      var result = action(state, actions, data)
      return resolve ? resolve(state, actions, result) : result
    }
  }
}
