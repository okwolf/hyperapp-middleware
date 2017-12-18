var isFn = function(value) {
  return typeof value === "function"
}

function compose(middleware) {
  return [].concat(middleware).reduce(
    function(prev, next) {
      return function(action, name) {
        Object.defineProperty(action, "name", {
          value: name
        })
        var nextAction = next(action) || action

        return prev(nextAction, name)
      }
    },
    function(action) {
      return action
    }
  )
}

function wrapAction(wrapper) {
  return function(data) {
    return function(state, actions) {
      var result = wrapper(data)
      result = isFn(result) ? result(state, actions) : result
      return result
    }
  }
}

function enhanceActions(enhancer, actionsTemplate, prefix) {
  var namespace = prefix ? prefix + "." : ""
  return Object.keys(actionsTemplate).reduce(function(otherActions, name) {
    var namedspacedName = namespace + name
    var userAction = actionsTemplate[name]

    otherActions[name] = isFn(userAction)
      ? wrapAction(function(data) {
          return enhancer(wrapAction(userAction), namedspacedName)(data)
        })
      : enhanceActions(enhancer, userAction, namedspacedName)

    return otherActions
  }, {})
}

export default function(middleware) {
  var enhancer = compose(middleware)

  return function(app) {
    return function(initialState, actionsTemplate, view, container) {
      var enhancedActions = enhanceActions(enhancer, actionsTemplate)

      var appActions = app(initialState, enhancedActions, view, container)
      return appActions
    }
  }
}
