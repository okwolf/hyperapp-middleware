import { app } from "hyperapp"
import { enhance, makeUpdate } from "../src"

test("optional updater", done =>
  enhance(
    makeUpdate((state, action) => {
      expect(action.name).toBe("init")
    })
  )(app)(
    {},
    {
      init: data => {
        expect(data).toEqual({ some: "data" })
        done()
      }
    }
  ).init({ some: "data" }))

test("receives current and next state", done =>
  enhance(
    makeUpdate((state, action, result) => {
      expect(state).toEqual({ count: 0 })
      expect(action).toEqual({ name: "inc", data: 2 })
      expect(result).toEqual({ count: 2 })
      done()
    })
  )(app)(
    {
      count: 0
    },
    {
      inc: by => state => ({ count: state.count + by })
    }
  ).inc(2))

test("validate state updates", () => {
  const appActions = enhance([
    // TODO: figure out why these are run in reverse
    // the order works correctly for enhance wihout makeUpdate
    makeUpdate((state, action, nextState) => {
      switch (action.name) {
        case "set":
          expect(state).toEqual({ value: "foo" })
          expect(action.data).toBe(null)
          expect(nextState).toEqual({ value: "foo" })
          break
        case "legitSet":
          expect(state).toEqual({ value: "foo" })
          expect(action.data).toBe("legit")
          expect(nextState).toEqual({ value: "legit" })
      }
      return nextState
    }),
    makeUpdate((state, action, nextState) => {
      return nextState && typeof nextState.value !== "string"
        ? state
        : nextState
    }),
    makeUpdate((state, action, nextState) => {
      switch (action.name) {
        case "set":
          expect(state).toEqual({ value: "foo" })
          expect(action.data).toBe(null)
          expect(nextState).toEqual({ value: null })
          break
        case "legitSet":
          expect(state).toEqual({ value: "foo" })
          expect(action.data).toBe("legit")
          expect(nextState).toEqual({ value: "legit" })
      }
      return nextState
    })
  ])(app)(
    {
      value: "foo"
    },
    {
      get: () => state => state,
      set: value => state => ({ value }),
      legitSet: value => state => ({ value })
    }
  )
  appActions.set(null)
  expect(appActions.get()).toEqual({ value: "foo" })
  appActions.legitSet("legit")
  expect(appActions.get()).toEqual({ value: "legit" })
})
