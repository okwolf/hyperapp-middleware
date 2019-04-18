# Hyperapp Middleware

[![Build Status](https://travis-ci.org/okwolf/hyperapp-middleware.svg?branch=master)](https://travis-ci.org/okwolf/hyperapp-middleware)
[![Codecov](https://img.shields.io/codecov/c/github/okwolf/hyperapp-middleware/master.svg)](https://codecov.io/gh/okwolf/hyperapp-middleware)
[![npm](https://img.shields.io/npm/v/hyperapp-middleware/next.svg)](https://www.npmjs.org/package/hyperapp-middleware/v/next)

A 0.7 KB utility belt to build higher-order `app`s (HOA) for [Hyperapp v2](https://github.com/jorgebucaran/hyperapp/tree/V2) using middleware functions for `onState`, `onAction`, and `onEffect`.

## Installation

### Node.js

Install with npm / Yarn.

<pre>
npm i <a href=https://www.npmjs.com/package/hyperapp-middleware/v/next>hyperapp-middleware@next</a>
</pre>

Then with a module bundler like [rollup](https://github.com/rollup/rollup) or [webpack](https://github.com/webpack/webpack), use as you would anything else.

```js
import { withMiddleware } from "hyperapp-middleware"
```

Or using require.

```js
const { withMiddleware } = require("hyperapp-middleware")
```

### Browser

Download the minified library from the [CDN](https://unpkg.com/hyperapp-middleware@next).

```html
<script src="https://unpkg.com/hyperapp-middleware@next"></script>
```

You can find the library in `window.hyperappMiddleware`.

## API

```js
withMiddleware({
  onState(nextState, prevState) {
    // prevState will be undefined for initial state
  },
  onAction(action, state, props, data) {
    // state is value before the action was processed
    // props are from the [action, props] tuple, if used
    // data is from second arg to dispatch, usually a DOM event
  },
  OnEffect(effect, state, props) {
    // state will be whatever state was included in the tuple
  }
})(app)({
  // ... the usual suspects
})
```

## License

Hyperapp Middleware is MIT licensed. See [LICENSE](LICENSE.md).
