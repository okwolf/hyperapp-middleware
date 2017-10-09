import { app } from "hyperapp"
import { enhance, makeUpdate } from "../src"

test("optional updater", done => {
  let expectedActionName = "start"
  const appActions = app(
    enhance(
      makeUpdate(action => {
        expect(action.name).toBe(expectedActionName)
        expectedActionName = expectedActionName === "start" ? "async" : "stop"
      })
    )
  )({
    actions: {
      start: (state, actions, data) => data,
      async: (state, actions, data) => update => update(data),
      stop: state => {
        expect(state).toEqual({ some: "data", other: "value" })
        done()
      }
    }
  })
  appActions.start({ some: "data" })
  appActions.async({ other: "value" })
  appActions.stop()
})

test("receives current and next state", done =>
  app(
    enhance(
      makeUpdate(action => (state, actions, nextState) => {
        expect(action.name).toBe("inc")
        expect(state).toEqual({ count: 0 })
        expect(nextState).toEqual({ count: 2 })
        done()
      })
    )
  )({
    state: {
      count: 0
    },
    actions: {
      inc: (state, actions, { by }) => ({ count: state.count + by })
    }
  }).inc({ by: 2 }))

test("validate sync and async state updates", done => {
  const appActions = app(
    enhance([
      makeUpdate(action => (state, actions, nextState) =>
        nextState && typeof nextState.value !== "string" ? state : nextState
      ),
      makeUpdate(action => (state, actions, nextState) => {
        switch (action.name) {
          case "set":
          case "setAsync":
            expect(state).toEqual({ value: "foo" })
            expect(nextState).toEqual({ value: null })
            break
          case "legitSet":
            expect(state).toEqual({ value: "foo" })
            expect(nextState).toEqual({ value: "legit" })
        }
        return nextState
      })
    ])
  )({
    state: {
      value: "foo"
    },
    actions: {
      set: (state, actions, value) => ({ value }),
      setAsync: (state, actions, value) => update => update({ value }),
      legitSet: (state, actions, value) => ({ value }),
      afterLegitSet: state => {
        expect(state).toEqual({ value: "legit" })
        done()
      }
    }
  })
  appActions.set(null)
  appActions.setAsync(null)
  appActions.legitSet("legit")
  appActions.afterLegitSet()
})
