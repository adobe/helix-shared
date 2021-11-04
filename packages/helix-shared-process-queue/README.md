# Helix Shared - process queue

## Usage

```js
const processQueue = require('@adobe/helix-shared-process-queue');

const tasks = [1, 2, 3];

await processQueue(tasks, async (task) => {
  console.log(task);
});

```
