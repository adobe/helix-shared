# Helix Shared Journal

S3-backed journal readers and writers, copied from the `auditlog` module in
`@adobe/helix-admin-support`. The existing storage format and behavior are
preserved, with the public API renamed from `AuditLog` to `Journal`.

## Usage

```js
import { Journal } from '@adobe/helix-shared-journal';

const options = { bucketName: 'helix-adobe-logs' };
const writer = await Journal.createWriter('org', 'site', console, options).init();
try {
  await writer.append([{ timestamp: Date.now(), action: 'preview' }]);
} finally {
  writer.close();
}

const reader = await Journal.createReader('org', 'site', console, options).init();
try {
  let next;
  do {
    const page = await reader.getEntries(
      Date.parse('2026-01-01'),
      Date.now(),
      { limit: 1000 },
      next,
    );
    console.log(page.entries);
    next = page.next;
  } while (next);
} finally {
  reader.close();
}
```

AWS credentials and region are resolved by the AWS SDK. The default bucket is
`helix-adobe-logs`; override it with `bucketName`. Omit the site (pass `undefined`)
to use the organization-wide log under `<org>/.all`.

Entries must have a millisecond `timestamp` and be appended in chronological order.
The writer stores gzip-compressed JSON files and maintains a `.index` file.
Use a single writer per log prefix to avoid concurrent read-modify-write conflicts.

The reader returns `{ entries, next? }`. Pass `next` back to retrieve the next page.
`limit` caps the number of entries; optional `maxSize` limits their serialized
size, but always allows at least one entry.

## Development

From the repository root:

```sh
npm test --workspace=@adobe/helix-shared-journal
npm run lint --workspace=@adobe/helix-shared-journal
```
