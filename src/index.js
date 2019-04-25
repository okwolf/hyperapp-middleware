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
  return function dispatchProxy(obj, props, stack) {
    stack = stack ? stack.slice() : []
    function unshiftAction(action, props, data) {
      if (props instanceof Event) {
        stack.unshift(["event", { event: props }])
      }
      if (data) {
        stack.unshift(["action", { action: action, data: data }])
      } else if (!(props instanceof Event)) {
        stack.unshift(["action", { action: action, data: props }])
      } else {
        stack.unshift(["action", { action: action }])
      }
    }
    originalDispatch(function(state) {
      return [
        state,
        [
          function() {
            if (typeof obj === "function") {
              unshiftAction(obj, props)
              dispatchProxy(obj(state, props), undefined, stack)
            } else if (isArray(obj)) {
              if (typeof obj[0] === "function") {
                unshiftAction(obj[0], props, obj[1])
                dispatchProxy(obj[0](state, obj[1], props), undefined, stack)
              } else {
                flatten(obj.slice(1)).map(function(fx) {
                  fx &&
                    fx[0](fx[1], function(obj, props) {
                      stack.unshift(["effect", { effect: fx[0], props: fx[1] }])
                      dispatchProxy(obj, props, stack)
                    })
                })
                dispatchProxy(obj[0], undefined, stack)
              }
            } else if (obj !== state) {
              stack.unshift(["state", { prevState: state, nextState: obj }])
              middleware(stack)
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
  middleware = middleware || noop

  return function(nextApp) {
    return function(props) {
      function enhancedInit(state) {
        return [
          state,
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
                return sub[0](props, function(obj, props) {
                  dispatchProxy(obj, props, [
                    [
                      "subscription",
                      {
                        subscription: sub[0],
                        props: sub[1]
                      }
                    ]
                  ])
                })
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
