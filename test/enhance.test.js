import { app } from "hyperapp"
import { enhance } from "../src"

test("implicit passthrough", done =>
  enhance(action => {
    expect(action.name).toBe("init")
  })(app)(
    {},
    {
      init: data => {
        expect(data).toEqual({ some: "data" })
        done()
      }
    }
  ).init({ some: "data" }))

test("explicit passthrough", done =>
  enhance(action => {
    expect(action.name).toBe("init")
    return action
  })(app)(
    {},
    {
      init: data => {
        expect(data).toEqual({ some: "data" })
        done()
      }
    }
  ).init({ some: "data" }))

test("receives action, state slice, actions, and action data", done =>
  enhance(action => data => (state, actions) => {
    expect(action.name).toBe("foo.fizz")
    expect(state).toEqual({ bar: "baz" })

    expect(actions).toEqual({
      fizz: expect.any(Function)
    })
    expect(data).toEqual({ fizz: "buzz" })
    done()
  })(app)(
    {
      foo: {
        bar: "baz"
      },
      ignored: {
        other: "state"
      }
    },
    {
      foo: {
        fizz: () => ({})
      },
      bar: {
        baz: () => ({})
      }
    }
  ).foo.fizz({ fizz: "buzz" }))

const skipActionNamed = name =>
  enhance(action => data => {
    if (action.name !== name) {
      return action(data)
    }
  })

test("skip action", done => {
  const appActions = skipActionNamed("foo")(app)(
    {},
    {
      foo: () => {
        throw new Error("should be skipped by middleware!")
      },
      bar: {
        baz: () => done()
      }
    }
  )
  appActions.foo()
  appActions.bar.baz()
})

test("multiple middleware", done => {
  let middleware1Called = false
  let middleware2Called = false
  let middleware3Called = false
  enhance([
    action => {
      expect(action.name).toBe("init")
      expect(middleware2Called).toBeFalsy()
      expect(middleware3Called).toBeFalsy()
      middleware1Called = true
    },
    action => data => (state, actions) => {
      expect(action.name).toBe("init")
      expect(state).toEqual({ fizz: { buzz: "fizzbuzz" } })
      expect(actions).toEqual({
        init: expect.any(Function)
      })
      expect(data).toEqual({ foo: "bar" })
      expect(middleware1Called).toBeTruthy()
      expect(middleware2Called).toBeFalsy()
      expect(middleware3Called).toBeFalsy()
      middleware2Called = true
      return action(data)(state, actions)
    },
    action => data => (state, actions) => {
      expect(action.name).toBe("init")
      expect(state).toEqual({ fizz: { buzz: "fizzbuzz" } })
      expect(actions).toEqual({
        init: expect.any(Function)
      })
      expect(data).toEqual({ foo: "bar" })
      expect(middleware1Called).toBeTruthy()
      expect(middleware2Called).toBeTruthy()
      expect(middleware3Called).toBeFalsy()
      middleware3Called = true
      return action(data)(state, actions)
    }
  ])(app)(
    {
      fizz: {
        buzz: "fizzbuzz"
      }
    },
    {
      init: data => {
        expect(data).toEqual({ foo: "bar" })
        expect(middleware3Called).toBeTruthy()
        done()
      }
    }
  ).init({ foo: "bar" })
})

test("state slices", () => {
  const actions = enhance(action => data => (state, actions) => {
    switch (action.name) {
      case "hello":
        expect(state).toEqual({ slice: { value: 0 } })
        break
      case "slice.up":
        expect(state).toEqual({ value: 0 })
        expect(data).toBe(2)
        break
      default:
        throw new Error(`Unexpected action: ${action.name}`)
    }

    const result = action(state, actions)
    return typeof result === "function" ? result(data) : result
  })(app)(
    {
      slice: {
        value: 0
      }
    },
    {
      hello: () => ({ message: "hello" }),
      slice: {
        up: by => state => ({ value: state.value + by })
      }
    }
  )
  actions.hello()
  actions.slice.up(2)
})
