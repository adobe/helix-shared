# Helix Shared - process queue

## Usage

Process tasks concurrently:
```js
const processQueue = require('@adobe/helix-shared-process-queue');

const tasks = [1, 2, 3];

const result = await processQueue(tasks, async (task) => {
  console.log(task);
  return someValue;
});
```

Access results during task
```js
const processQueue = require('@adobe/helix-shared-process-queue');

const tasks = [1, 2, 3];

const result = await processQueue(tasks, async (task, queue, results) => {
  if (somecondition(results)) {
    // returning undefined does not add the return value to results
    return;
  }
  return someValue;
});
```

