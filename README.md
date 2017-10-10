# Hyperapp Middleware

[![Build Status](https://travis-ci.org/okwolf/hyperapp-middleware.svg?branch=master)](https://travis-ci.org/okwolf/hyperapp-middleware)
[![Codecov](https://img.shields.io/codecov/c/github/okwolf/hyperapp-middleware/master.svg)](https://codecov.io/gh/okwolf/hyperapp-middleware)
[![npm](https://img.shields.io/npm/v/hyperapp-middleware.svg)](https://www.npmjs.org/package/hyperapp-middleware)

A 0.4 KB utility belt to build higher-order `app`s (HOAp) for [Hyperapp](https://github.com/hyperapp/hyperapp) using higher-order `actions` (HOAc) known as `middleware`.

## Installation

### Node.js

Install with npm / Yarn.

<pre>
npm i <a href="https://www.npmjs.com/package/hyperapp-middleware">hyperapp-middleware</a>
</pre>

Then with a module bundler like [rollup](https://github.com/rollup/rollup) or [webpack](https://github.com/webpack/webpack), use as you would anything else.

```js
import { enhance } from "hyperapp-middleware"
```

Or using require.

```js
const { enhance } = require("hyperapp-middleware")
```

### Browser

Download the minified library from the [CDN](https://unpkg.com/hyperapp-middleware).

```html
<script src="https://unpkg.com/hyperapp-middleware"></script>
```

You can find the library in `window.middleware`.

## API

First, a few formal definitions with the shape of some common types of interest.

* An `ActionResult` is a `State` slice, `Thunk`, empty object, or falsy value
* An `Action` is a function that receives the current `State`, `Actions`, and `data` from the `Action` call. It returns an `ActionResult`
* `ActionInfo` is an object that describes a call to an `Action` by its `name` and what `data` was passed to the `Action` function
* An `HOAc`/`Middleware` is a function that takes an `Action` function as its argument and returns another `Action` function, or a falsy value to use the result of the original `Action` instead of the `Middleware`
* An `HOAp` is a function that takes an `App` function and returns another `App` function

```js
ActionResult = Partial<State> | Thunk | {} | falsy
Action = function(State, Actions, data: any): ActionResult
ActionInfo = { name: string, data: any }
HOAc = Middleware = function(Action): Action | falsy
HOAp = function(App) : App
```

### `enhance`

The most basic primitive used for applying `middleware` to `actions` in an app. This is a function that accepts either a singular `middleware`, or an array of such functions, and returns an HOAp.

```js
enhance = function(
  Middleware | [ Middleware ]
): HOAp
```

#### Usage

Bear in mind that this option comes with the most power and therefore you have the most responsibility when using it.

```js
// To pass multiple middleware, use an array
enhance(
  // This is the original action function
  // that would have been called
  // if not for the middleware
  action =>
  // This is the new action function being returned
  // If you decide to bail early on this action
  // then return something falsy instead.
  (state, actions, data) => {
    // Feel free to call any additional actions before or after the original action
    actions.foo()

    // The author of the middleware
    // is responsible for calling the action
    // If and when they so desire.
    // You can use modified state, actions,
    // or data if that's what you're into.
    const result = action(state, actions, data)

    // Make sure to return what you want
    // the result of the action to be
    return result
  }
)(app)({
...
})
```

### `makeResolve`

This HOHOAc (higher-order higher-order action) is a helper for creating HOAcs that are used for reacting to/modifying the results of`Action`s. The `Resolver` passed to `makeResolve` is used to create the `Resolve` function that receives `Action` results or a falsy value to skip this entirely. An HOAc is returned which can be converted to a usable HOAp with `enhance`.

```js
Resolve = function(State, Actions, result: any)
Resolver = function(ActionInfo) : Resolve | falsy
makeResolve = function(Resolver): HOAc
```

#### Usage

Here is an example of using `makeResolve` to support actions returning a `Promise` for async updates.

```js
enhance([
  makeResolve(() => (state, actions, result) => {
    return result
      && typeof result.then === "function"
      ? update => result.then(update)
      : result
  }),
  ...
  // Other middleware for fun & profit
])(app)({
...
})
```

### `makeUpdate`

This function works similiarly to `makeResolve` except that it is called after a sync/async `Action` completes and is requesting to update the `State`. The `Updater` passed to `makeUpdate` is used to create the `Update` function for validating/modifying state updates or a falsy value to skip this entirely. An HOAc is returned which can be converted to a usable HOAp with `enhance`.

```js
Update = function(State, Actions, nextState: State)
Updater = function(ActionInfo) : Update | falsy
makeUpdate = function(Updater): HOAc
```

#### Usage

```js
enhance(
  makeUpdate(() => (state, actions, nextState) => {
    // Return what you want the updated state to be
    // Use state if you want to leave the current value unchanged
    // Use nextState if the update is valid
    // Use another value if you need to normalize
    // the new state value.
  }),
  ...
)(app)({
...
})
```

## License

Hyperapp Middleware is MIT licensed. See [LICENSE](LICENSE.md).