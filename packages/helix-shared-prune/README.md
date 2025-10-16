# Helix Shared - prune

The `pruneEmptyValues` function is a utility for cleaning up objects by removing properties with empty values. This is particularly useful when preparing data for serialization, API responses, or when you need to ensure that only meaningful data is present in an object.

A value is considered empty if it's not truthy (falsy values like `''`, `undefined`, `null`, `0`, `false`) or if it's an empty array (`[]`).

```js
import pruneEmptyValues from '@adobe/helix-shared-prune';

const data = {
  name: 'John Doe',
  email: '',
  age: 0,
  active: false,
  tags: [],
  metadata: {},
  description: undefined,
};

const pruned = pruneEmptyValues(data);
// Result: { name: 'John Doe', metadata: {} }
```

## Behavior

The function modifies the input object in place and returns it. If all properties are removed, the function returns `null` instead of an empty object.

### What Gets Removed

- Empty strings (`''`)
- `undefined` values
- `null` values
- `false` boolean values
- `0` numeric values
- Empty arrays (`[]`)

### What Gets Kept

- Non-empty strings
- Non-zero numbers
- `true` boolean values
- Non-empty arrays
- Objects (even if empty)

## Examples

### Basic Usage

```js
import pruneEmptyValues from '@adobe/helix-shared-prune';

const user = {
  username: 'alice',
  password: '',
  verified: false,
  loginCount: 0,
  roles: [],
  settings: {},
};

const cleaned = pruneEmptyValues(user);
// Result: { username: 'alice', settings: {} }
```

### Handling Completely Empty Objects

When all properties are empty, the function returns `null`:

```js
const empty = {
  field1: '',
  field2: undefined,
  field3: null,
};

const result = pruneEmptyValues(empty);
// Result: null
```

### Preparing API Responses

```js
import pruneEmptyValues from '@adobe/helix-shared-prune';

function formatResponse(data) {
  return pruneEmptyValues({
    status: data.status,
    message: data.message || '',
    errors: data.errors || [],
    data: data.payload,
  });
}
```

## Important Notes

- The function mutates the input object
- Empty objects (`{}`) are not removed, only empty arrays are
- Returns `null` if the object becomes completely empty after pruning
- Use with caution when `0` or `false` are meaningful values in your data model
