import { app } from "hyperapp"
import { enhance, makeResolve } from "../src"

test("optional resolver", done =>
  app(
    enhance(
      makeResolve(action => {
        expect(action.name).toBe("init")
      })
    )
  )({
    actions: {
      init(state, actions, data) {
        expect(data).toEqual({ some: "data" })
        done()
      }
    }
  }).init({ some: "data" }))

const chainActionWithData = (sourceName, targetName, data) =>
  enhance(
    makeResolve(action => (state, actions) => {
      if (action.name === sourceName) {
        actions[targetName](data)
      }
    })
  )

test("trigger chained action", done =>
  app(chainActionWithData("foo", "bar", { baz: "foobar" }))({
    actions: {
      foo: (state, actions, data) => {
        expect(data).toEqual({ bar: "baz" })
      },
      bar: (state, actions, data) => {
        expect(data).toEqual({ baz: "foobar" })
        done()
      }
    }
  }).foo({ bar: "baz" }))

const withPromise = makeResolve(() => (state, actions, result) => {
  return result && typeof result.then === "function"
    ? update => result.then(update)
    : result
})

test("add Promise support", done => {
  const appActions = app(
    enhance([
      withPromise,
      action => (state, actions, data) => {
        switch (action.name) {
          case "upSync":
            expect(state).toEqual({ count: 0 })
            expect(data).toEqual({ by: 3 })
            break
          case "upPromise":
            expect(state).toEqual({ count: 3 })
            expect(data).toEqual({ by: 2 })
            break
          case "downSync":
            expect(state).toEqual({ count: 5 })
            expect(data).toEqual({ by: 1 })
            break
          case "downPromise":
            expect(state).toEqual({ count: 4 })
            expect(data).toEqual({ by: 4 })
        }
        return action(state, actions, data)
      }
    ])
  )({
    state: {
      count: 0
    },
    actions: {
      upSync: (state, actions, { by }) => ({ count: state.count + by }),
      downSync: (state, actions, { by }) => ({ count: state.count - by }),
      upPromise: (state, actions, { by }) =>
        Promise.resolve({ count: state.count + by }).then(resolved => {
          expect(resolved).toEqual({ count: 5 })
          return resolved
        }),
      downPromise: (state, actions, { by }) =>
        Promise.resolve({ count: state.count - by }).then(resolved => {
          expect(resolved).toEqual({ count: 0 })
          return resolved
        })
    }
  })
  appActions.upSync({ by: 3 })
  appActions
    .upPromise({ by: 2 })
    .then(resolved => {
      expect(resolved).toEqual({ count: 5 })
      appActions.downSync({ by: 1 })
      return appActions.downPromise({ by: 4 })
    })
    .then(resolved => {
      expect(resolved).toEqual({ count: 0 })
      done()
    })
})
