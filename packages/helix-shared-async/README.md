# Helix Shared - async

Utility functions for working with asynchronous operations in JavaScript. This package provides commonly needed async primitives like sleep timers and event loop management.

## Installation

```bash
npm install @adobe/helix-shared-async
```

## Usage

```js
import { sleep, nextTick } from '@adobe/helix-shared-async';
```

## API

### `sleep(ms)`

Pauses execution for a specified number of milliseconds. Returns a Promise that resolves after the specified delay.

```js
import { sleep } from '@adobe/helix-shared-async';

async function example() {
  console.log('Starting...');
  await sleep(1000); // Wait for 1 second
  console.log('Done!');
}
```

**Parameters:**
- `ms` (number): The number of milliseconds to sleep

**Returns:** A Promise that resolves after the specified delay

### `nextTick()`

Awaits the next tick of the event loop. This allows you to yield control back to the event loop, enabling other pending operations to execute before continuing.

**Important:** Internally this uses `setImmediate`, not `process.nextTick`. This is because `process.nextTick` and `setImmediate` are horribly named and their [names should be swapped](https://github.com/nodejs/node/blob/v6.x/doc/topics/event-loop-timers-and-nexttick.md).

```js
import { nextTick } from '@adobe/helix-shared-async';

async function processInBatches(items) {
  for (const item of items) {
    await processItem(item);
    // Yield to the event loop after each item
    // This prevents blocking other operations
    await nextTick();
  }
}
```

**Returns:** A Promise that resolves during the next tick of the event loop

## Use Cases

### Rate Limiting with Sleep

Use `sleep` to implement simple rate limiting or retry logic:

```js
import { sleep } from '@adobe/helix-shared-async';

async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      return response;
    } catch (error) {
      if (i < maxRetries - 1) {
        // Wait before retrying, with exponential backoff
        await sleep(Math.pow(2, i) * 1000);
      } else {
        throw error;
      }
    }
  }
}
```

### Preventing Event Loop Blocking with nextTick

Use `nextTick` to prevent CPU-intensive operations from blocking the event loop:

```js
import { nextTick } from '@adobe/helix-shared-async';

async function processLargeDataset(data) {
  const results = [];

  for (let i = 0; i < data.length; i++) {
    // Process item
    results.push(computeExpensiveOperation(data[i]));

    // Yield to event loop every 100 items
    if (i % 100 === 0) {
      await nextTick();
    }
  }

  return results;
}
```
