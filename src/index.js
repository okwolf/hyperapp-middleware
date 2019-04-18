var EMPTY_ARRAY = []
var isArray = Array.isArray
var noop = Function.prototype

function assign(source, assignments) {
  var result = {},
    i
  for (i in source) result[i] = source[i]
  for (i in assignments) result[i] = assignments[i]
  return result
}

function flatten(arr) {
  return arr.reduce(function(out, obj) {
    return out.concat(
      !obj || obj === true
        ? false
        : typeof obj[0] === "function"
        ? [obj]
        : flatten(obj)
    )
  }, EMPTY_ARRAY)
}

function makeDispatchProxy(originalDispatch, middleware) {
  return function dispatchProxy(obj, props) {
    originalDispatch(function(state) {
      return [
        state,
        [
          function() {
            if (typeof obj === "function") {
              middleware.onAction(obj, state, undefined, props)
              dispatchProxy(obj(state, props))
            } else if (isArray(obj)) {
              if (typeof obj[0] === "function") {
                middleware.onAction(obj[0], state, obj[1], props)
                dispatchProxy(obj[0](state, obj[1], props))
              } else {
                flatten(obj.slice(1)).map(function(fx) {
                  middleware.onEffect(fx[0], obj[0], fx[1])
                  fx && fx[0](fx[1], dispatchProxy)
                }, dispatchProxy(obj[0]))
              }
            } else {
              middleware.onState(obj, state)
              originalDispatch(obj)
            }
          }
        ]
      ]
    })
  }
}

function patchVdom(vdom, middleware) {
  if (typeof vdom === "object" && vdom !== null) {
    for (var key in vdom.props) {
      if (key[0] === "o" && key[1] === "n") {
        var originalAction = vdom.props[key]
        vdom.props[key] = function(state, event) {
          return [
            state,
            [
              function(_, dispatch) {
                var dispatchProxy = makeDispatchProxy(dispatch, middleware)
                dispatchProxy(originalAction, event)
              }
            ]
          ]
        }
      }
    }
    for (var i in vdom.children) {
      patchVdom(vdom.children[i], middleware)
    }
  }
}

export function withMiddleware(middleware) {
  middleware.onState = middleware.onState || noop
  middleware.onAction = middleware.onAction || noop
  middleware.onEffect = middleware.onEffect || noop

  return function(nextApp) {
    return function(props) {
      function enhancedInit() {
        return [
          undefined,
          [
            function(_, dispatch) {
              var dispatchProxy = makeDispatchProxy(dispatch, middleware)
              dispatchProxy(props.init)
            }
          ]
        ]
      }

      function enhancedView(state) {
        var vdom = props.view(state)
        patchVdom(vdom, middleware)
        return vdom
      }

      var proxySubMappings = []
      function enhancedSubscriptions(state) {
        if (!props.subscriptions) return []
        return props.subscriptions(state).map(function(sub) {
          var proxySubMapping = proxySubMappings.find(function(proxySub) {
            return proxySub[0] === sub[0]
          })
          if (!proxySubMapping) {
            proxySubMapping = [
              sub[0],
              function(props, dispatch) {
                var dispatchProxy = makeDispatchProxy(dispatch, middleware)
                return sub[0](props, dispatchProxy)
              }
            ]
            proxySubMappings.push(proxySubMapping)
          }
          return [proxySubMapping[1], sub[1]]
        })
      }
      return nextApp(
        assign(props, {
          init: enhancedInit,
          view: enhancedView,
          subscriptions: enhancedSubscriptions
        })
      )
    }
  }
}
