import { app } from "hyperapp"
import { enhance } from "../src"

test("implicit passthrough", done =>
  app(
    enhance(action => {
      expect(action.name).toBe("init")
    })
  )({
    actions: {
      init(state, actions, data) {
        expect(data).toEqual({ some: "data" })
        done()
      }
    }
  }).init({ some: "data" }))

test("explicit passthrough", done =>
  app(
    enhance(action => {
      expect(action.name).toBe("init")
      return action
    })
  )({
    actions: {
      init(state, actions, data) {
        expect(data).toEqual({ some: "data" })
        done()
      }
    }
  }).init({ some: "data" }))

test("receives action, state slice, actions, and action data", done =>
  app(
    enhance(action => (state, actions, data) => {
      expect(action.name).toBe("fizz")
      expect(state).toEqual({ bar: "baz" })

      expect(actions).toEqual({
        fizz: expect.any(Function)
      })
      expect(data).toEqual({ fizz: "buzz" })
      done()
    })
  )({
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
  const appActions = app(skipActionNamed("foo"))({
    actions: {
      foo: () => {
        throw new Error("should be skipped by middleware!")
      },
      bar: {
        baz: done
      }
    }
  })
  appActions.foo()
  appActions.bar.baz({ bar: "baz" })
})

test("multiple middleware", done => {
  let middleware1Called = false
  let middleware2Called = false
  app(
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
    ])
  )({
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
