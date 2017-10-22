function compose(middleware) {
  return [].concat(middleware).reduce(
    function(prev, next) {
      return function(action) {
        const nextAction = next(action) || action
        Object.defineProperty(nextAction, "name", {
          value: action.name
        })
        return prev(nextAction)
      }
    },
    function(action) {
      return action
    }
  )
}

export default function(middleware) {
  const enhancer = compose(middleware)
  function enhanceActions(actions, prefix) {
    var namespace = prefix ? prefix + "." : ""
    return Object.keys(actions).reduce(function(otherActions, name) {
      var namedspacedName = namespace + name
      var action = actions[name]
      Object.defineProperty(action, "name", {
        value: namedspacedName
      })
      otherActions[name] =
        typeof action === "function"
          ? enhancer(action)
          : enhanceActions(action, namedspacedName)
      return otherActions
    }, {})
  }
  return function(app) {
    return function(props) {
      props.actions = enhanceActions(props.actions)
      return app(props)
    }
  }
}
