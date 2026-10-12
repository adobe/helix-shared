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
  const pagination = { limit: 1000 };
  let page = await reader.getEntries(
    Date.parse('2026-01-01'),
    Date.now(),
    pagination,
  );
  console.log(page.entries);
  while (page.start && page.end) {
    page = await reader.getNextPage(page.start, page.end, pagination);
    console.log(page.entries);
  }
} finally {
  reader.close();
}
```

AWS credentials and region are resolved by the AWS SDK. The default bucket is
`helix-adobe-logs`; override it with `bucketName`. Omit the site (pass `undefined`)
to use the organization-wide log under `<org>/.all`.

Use `Journal.getBucketAndKey('org', 'site', 'custom.json')` to get
`{ bucket: 'helix-adobe-logs', key: 'org/site/custom.json' }` for a custom file
alongside the journal. Pass `undefined` as the site to use the key
`org/.all/custom.json` instead. An optional fourth argument, `{ bucketName }`,
overrides the default bucket.

Entries must have a millisecond `timestamp` and be appended in chronological order.
The writer stores gzip-compressed JSON files and maintains a `.index` file.
Use a single writer per log prefix to avoid concurrent read-modify-write conflicts.

Call `getEntries(from, to, options)` once to retrieve the first page. The reader
returns `{ entries, start?, end? }`. While both `start` and `end` are present,
pass them to `getNextPage(start, end, options)` to retrieve the next page.
`limit` caps the number of entries; optional `maxSize` limits their serialized
size, but always allows at least one entry.

## Development

From the repository root:

```sh
npm test --workspace=@adobe/helix-shared-journal
npm run lint --workspace=@adobe/helix-shared-journal
```
