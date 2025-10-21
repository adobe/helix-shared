# Helix Shared - wrap

The wrap utility provides a clean and elegant way to compose middleware functions around your main handler function. It enables you to chain multiple wrappers together in a readable and maintainable way, allowing you to add cross-cutting concerns like logging, monitoring, authentication, and error handling without cluttering your core business logic.

## Installation

```bash
npm install @adobe/helix-shared-wrap
```

## Basic Usage

```js
import wrap from '@adobe/helix-shared-wrap';

async function main(req, context) {
  // your main handler logic
  return new Response('Hello World');
}

export const handler = wrap(main)
  .with(logger)
  .with(errorHandler)
  .with(auth);
```

## How It Works

The `wrap` function takes your main handler and returns a wrappable function with a `.with()` method. Each call to `.with()` applies a wrapper function and returns a new wrappable function, allowing you to chain multiple wrappers together.

**Important:** The execution order is that the last wrapper added will be executed first. In the example above, `auth` runs first, then `errorHandler`, then `logger`, and finally your `main` function.

## Creating Wrapper Functions

A wrapper function receives the wrapped function as its first argument, followed by any configuration options. It should return a new function with the same signature as the original.

```js
function logger(fn, options = {}) {
  return async (req, context) => {
    console.log(`[${options.level || 'info'}] Request received`);
    const result = await fn(req, context);
    console.log(`[${options.level || 'info'}] Request completed`);
    return result;
  };
}

function errorHandler(fn) {
  return async (req, context) => {
    try {
      return await fn(req, context);
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  };
}

export const handler = wrap(main)
  .with(errorHandler)
  .with(logger, { level: 'debug' });
```

## Advanced Example: Request Timing

```js
function timer(fn, label = 'execution') {
  return async (...args) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      console.log(`${label} took ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`${label} failed after ${duration}ms`);
      throw error;
    }
  };
}

export const handler = wrap(main)
  .with(timer, 'main handler');
```

## Execution Order

When multiple wrappers are chained, they execute in reverse order of how they're added:

```js
const handler = wrap(main)
  .with(wrapper1)  // executes third
  .with(wrapper2)  // executes second
  .with(wrapper3); // executes first
```

This follows the common middleware pattern where the outermost wrapper has the first opportunity to handle the request and the last opportunity to process the response.

## TypeScript Support

The package includes TypeScript definitions. The `WrapFunction` type describes the signature for wrapper functions:

```typescript
type WrapFunction = (fn: Function, ...opts: any[]) => Function;
```

The wrapped function becomes a `WrappableFunction` that includes the `.with()` method for further wrapping.
