# Helix Shared - Server Timing

The Server Timing middleware provides automatic performance monitoring and profiling for your serverless functions by tracking execution time and adding standardized `Server-Timing` HTTP headers to responses. This enables performance analysis using browser DevTools or other monitoring tools that support the [Server Timing API](https://www.w3.org/TR/server-timing/).

When wrapped around a function, the middleware creates a timer object on the context that you can use to record timestamps at important execution milestones. Upon completion, it automatically generates a `Server-Timing` header with all recorded metrics.

```js
import { wrap } from '@adobe/helix-universal';
import serverTiming from '@adobe/helix-shared-server-timing';

async function main(req, context) {
  const { timer } = context;

  timer.update('fetch-data');
  const data = await fetchData();

  timer.update('process-data');
  const result = processData(data);

  timer.update('render');
  const html = render(result);

  return new Response(html);
}

export const handler = wrap(main)
  .with(serverTiming);
```

The resulting response will include a `Server-Timing` header like:

```
Server-Timing: p00;dur=45.2;desc=fetch-data ,p01;dur=12.8;desc=process-data ,p02;dur=8.4;desc=render ,total;dur=66.4
```

## Timer API

The middleware adds a `timer` object to the context with the following methods:

### `timer.update(name)`

Records a timestamp for a named step in your function's execution. Each call to `update()` marks the end of the previous step and the beginning of a new one.

- `name` (string): A descriptive name for the step being completed

```js
async function main(req, context) {
  const { timer } = context;

  timer.update('database-query');
  await db.query('SELECT * FROM users');

  timer.update('api-call');
  await fetch('https://api.example.com/data');

  return new Response('Done');
}
```

### `timer.report(context)`

Generates the timing report string. This is called automatically by the middleware, but can be used manually if needed.

- `context`: The context object containing the logger
- Returns: A string formatted for the `Server-Timing` header

## How It Works

1. When the middleware wraps your function, it creates a timer and attaches it to the context
2. Your function can call `timer.update()` at any point to record a milestone
3. After your function completes, the middleware automatically:
   - Calls `timer.update('end')` to mark the final timestamp
   - Calculates the duration of each step
   - Generates a `Server-Timing` header with all metrics
   - Adds the header to the response (if not already present)

The timing uses high-resolution timestamps from `process.hrtime()` for accuracy, with durations reported in milliseconds.

## Viewing Timing Data

The `Server-Timing` header can be viewed in:

- **Browser DevTools**: Chrome, Firefox, and Edge display server timing data in the Network tab's Timing panel
- **Performance monitoring tools**: Many APM and monitoring solutions can parse and visualize Server Timing headers
- **Custom analysis**: The standardized format makes it easy to parse and analyze timing data programmatically

## Existing Headers

If your function's response already has a `server-timing` header, the middleware will not overwrite it. This allows you to have fine-grained control over the timing data when needed.

```js
async function main(req, context) {
  const headers = new Headers();
  headers.set('server-timing', 'custom;dur=100');
  return new Response('OK', { headers });
}
```
