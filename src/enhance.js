function compose(middleware) {
  return Array.isArray(middleware)
    ? middleware.reduce(
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
    : function(action) {
        return middleware(action)
      }
}

export default function(middleware) {
  const enhancer = compose(middleware)
  return function(app) {
    return function(props) {
      function enhance(actions) {
        return Object.keys(actions).reduce(function(otherActions, name) {
          var action = actions[name]
          otherActions[name] =
            typeof action === "function"
              ? enhancer(action) || action
              : enhance(action)
          return otherActions
        }, {})
      }
      props.actions = enhance(props.actions)
      return app(props)
    }
  }
}
