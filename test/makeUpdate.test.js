import { app } from "hyperapp"
import { enhance, makeUpdate } from "../src"

test("optional updater", () =>
  enhance(
    makeUpdate(action => {
      expect(action.name).toBe("init")
    })
  )(app)({
    actions: {
      init: () => data => {
        expect(data).toEqual({ some: "data" })
      }
    }
  }).init({ some: "data" }))

test("receives current and next state", () =>
  enhance(
    makeUpdate(action => (state, actions, nextState) => {
      expect(action.name).toBe("inc")
      expect(state).toEqual({ count: 0 })
      expect(nextState).toEqual({ count: 2 })
    })
  )(app)({
    state: {
      count: 0
    },
    actions: {
      inc: state => by => ({ count: state.count + by })
    }
  }).inc(2))

test("validate state updates", () => {
  const appActions = enhance([
    makeUpdate(action => (state, actions, nextState) =>
      nextState && typeof nextState.value !== "string" ? state : nextState
    ),
    makeUpdate(action => (state, actions, nextState) => {
      switch (action.name) {
        case "set":
          expect(state).toEqual({ value: "foo" })
          expect(nextState).toEqual({ value: null })
          break
        case "legitSet":
          expect(state).toEqual({ value: "foo" })
          expect(nextState).toEqual({ value: "legit" })
      }
      return nextState
    })
  ])(app)({
    state: {
      value: "foo"
    },
    actions: {
      get: state => state,
      set: state => value => ({ value }),
      legitSet: state => value => ({ value })
    }
  })
  appActions.set(null)
  appActions.legitSet("legit")
  expect(appActions.get()).toEqual({ value: "legit" })
})

const chainActionWithData = (sourceName, targetName, data) =>
  enhance(
    makeUpdate(action => (state, actions) => {
      if (action.name === sourceName) {
        actions[targetName](data)
      }
    })
  )

test("trigger chained action", () => {
  const appActions = chainActionWithData("foo", "bar", { baz: "foobar" })(app)({
    actions: {
      foo: state => data => {
        expect(data).toEqual({ bar: "baz" })
      },
      bar: state => data => {
        expect(data).toEqual({ baz: "foobar" })
      }
    }
  })
  appActions.foo({ bar: "baz" })
})

const withPromise = makeUpdate(() => (state, actions, result) =>
  result && typeof result.then === "function"
    ? update => result.then(update)
    : result
)

test("add Promise support", done => {
  const appActions = enhance([
    withPromise,
    action => (state, actions) => data => {
      switch (action.name) {
        case "upSync":
          expect(state).toEqual({ count: 0 })
          expect(data).toEqual(3)
          break
        case "upPromise":
          expect(state).toEqual({ count: 3 })
          expect(data).toEqual(2)
          break
        case "downSync":
          expect(state).toEqual({ count: 5 })
          expect(data).toEqual(1)
          break
        case "downPromise":
          expect(state).toEqual({ count: 4 })
          expect(data).toEqual(4)
      }
      return action(state, actions)(data)
    }
  ])(app)({
    state: {
      count: 0
    },
    actions: {
      upSync: state => by => ({ count: state.count + by }),
      downSync: state => by => ({ count: state.count - by }),
      upPromise: (state, actions) => by =>
        Promise.resolve({ count: state.count + by }).then(nextState => {
          expect(nextState).toEqual({ count: 5 })
          return nextState
        }),
      downPromise: state => by =>
        Promise.resolve({ count: state.count - by }).then(nextState => {
          expect(nextState).toEqual({ count: 0 })
          return nextState
        })
    }
  })
  appActions.upSync(3)
  appActions.upPromise(2)
  process.nextTick(() => {
    appActions.downSync(1)
    appActions.downPromise(4)
    done()
  })
})
