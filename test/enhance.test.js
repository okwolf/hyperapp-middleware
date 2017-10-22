import { app } from "hyperapp"
import { enhance } from "../src"

test("implicit passthrough", done =>
  enhance(action => {
    expect(action.name).toBe("init")
  })(app)({
    actions: {
      init(state, actions, data) {
        expect(data).toEqual({ some: "data" })
        done()
      }
    }
  }).init({ some: "data" }))

test("explicit passthrough", done =>
  enhance(action => {
    expect(action.name).toBe("init")
    return action
  })(app)({
    actions: {
      init(state, actions, data) {
        expect(data).toEqual({ some: "data" })
        done()
      }
    }
  }).init({ some: "data" }))

test("receives action, state slice, actions, and action data", done =>
  enhance(action => (state, actions, data) => {
    expect(action.name).toBe("foo.fizz")
    expect(state).toEqual({ bar: "baz" })

    expect(actions).toEqual({
      fizz: expect.any(Function)
    })
    expect(data).toEqual({ fizz: "buzz" })
    done()
  })(app)({
    state: {
      foo: {
        bar: "baz"
      },
      ignored: {
        other: "state"
      }
    },
    actions: {
      foo: {
        fizz: () => ({})
      },
      bar: {
        baz: () => ({})
      }
    }
  }).foo.fizz({ fizz: "buzz" }))

const skipActionNamed = name =>
  enhance(action => (state, actions, data) => {
    if (action.name !== name) {
      action(state, actions, data)
    }
  })

test("skip action", done => {
  const appActions = skipActionNamed("foo")(app)({
    actions: {
      foo: () => {
        throw new Error("should be skipped by middleware!")
      },
      bar: {
        baz: () => done()
      }
    }
  })
  appActions.foo()
  appActions.bar.baz({ bar: "baz" })
})

test("multiple middleware", done => {
  let middleware1Called = false
  let middleware2Called = false
  enhance([
    action => (state, actions, data) => {
      expect(action.name).toBe("init")
      expect(state).toEqual({ fizz: { buzz: "fizzbuzz" } })
      expect(actions).toEqual({
        init: expect.any(Function)
      })
      expect(data).toEqual({ foo: "bar" })
      expect(middleware2Called).toBeFalsy()
      middleware1Called = true
      return action(state, actions, data)
    },
    action => (state, actions, data) => {
      expect(action.name).toBe("init")
      expect(state).toEqual({ fizz: { buzz: "fizzbuzz" } })
      expect(actions).toEqual({
        init: expect.any(Function)
      })
      expect(data).toEqual({ foo: "bar" })
      expect(middleware1Called).toBeTruthy()
      middleware2Called = true
      return action(state, actions, data)
    },
    action => {
      expect(action.name).toBe("init")
    }
  ])(app)({
    state: {
      fizz: {
        buzz: "fizzbuzz"
      }
    },
    actions: {
      init(state, actions, data) {
        expect(data).toEqual({ foo: "bar" })
        done()
      }
    }
  }).init({ foo: "bar" })
})

test("state slices", done =>
  enhance(action => (state, actions, data) => {
    switch (action.name) {
      case "hello":
        expect(state).toEqual({ slice: { value: 0 } })
        break
      case "slice.up":
        expect(state).toEqual({ value: 0 })
        break
      case "slice.upWithThunk":
        expect(state).toEqual({ value: 1 })
        expect(data).toBe(2)
        done()
        break
      default:
        throw new Error(`Unexpected action: ${action.name}`)
    }

    return action(state, actions, data)
  })(app)({
    state: {
      slice: {
        value: 0
      }
    },
    actions: {
      hello: () => ({ message: "hello" }),
      slice: {
        up: state => ({ value: state.value + 1 }),
        upWithThunk: (state, actions, data) => update =>
          update({ value: state.value + data })
      }
    },
    init(state, actions) {
      actions.hello()
      actions.slice.up()
      actions.slice.upWithThunk(2)
    }
  }))

test("modules", done => {
  const foo = {
    state: {
      value: 0
    },
    actions: {
      up: (state, actions, data) => ({ value: state.value + data })
    },
    modules: {
      bar: {
        state: {
          text: "hello"
        },
        actions: {
          change: (state, actions, text) => ({ text })
        }
      }
    }
  }

  enhance(action => (state, actions, data) => {
    switch (action.name) {
      case "hello":
        expect(state).toEqual({
          message: "",
          foo: { value: 0, bar: { text: "hello" } }
        })
        expect(data).toBe("hello world")
        break
      case "foo.up":
        expect(state).toEqual({
          value: 0,
          bar: {
            text: "hello"
          }
        })
        expect(data).toBe(3)
        break
      case "foo.bar.change":
        expect(state).toEqual({
          text: "hello"
        })
        expect(data).toBe("hola")
        done()
        break
      default:
        throw new Error(`Unexpected action: ${action.name}`)
    }

    return action(state, actions, data)
  })(app)({
    state: {
      message: ""
    },
    actions: {
      hello: (state, actions, message) => ({ message })
    },
    modules: {
      foo
    },
    init(state, actions) {
      actions.hello("hello world")
      actions.foo.up(3)
      actions.foo.bar.change("hola")
    }
  })
})
