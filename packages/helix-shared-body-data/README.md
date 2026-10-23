# Helix Shared - Body Data Wrapper

Wraps a [Helix Universal](https://github.com/adobe/helix-universal) function and puts the request's
query parameters and body into `context.data`.

## Usage

```javascript
import wrap from '@adobe/helix-shared-wrap';
import bodyData from '@adobe/helix-shared-body-data';

async function run(request, context) {
  const { query, body, type } = context.data;
  …
}

export const main = wrap(run)
  .with(bodyData);
```

## What is in `context.data`

`context.data` is `{ query, body, type }`. `query` is always set. `body` and `type` are only set
when the wrapper read the body:

| request | `query` | `body` | `type` |
|---|---|---|---|
| GET, DELETE and other methods | query parameters | not set | not set |
| POST, PUT, PATCH with a JSON type | query parameters | parsed object or array | `json` |
| POST, PUT, PATCH with `application/x-www-form-urlencoded` | query parameters | object | `form` |
| POST, PUT, PATCH with a YAML type | query parameters | string | `yaml` |
| POST, PUT, PATCH with a `text/*` type | query parameters | string (UTF-8) | `text` |
| POST, PUT, PATCH with any other type, or none | query parameters | not set | not set |

A JSON type is `*/json` or `*/*+json`, a YAML type is `*/yaml` or `*/x-yaml`. Only the media type
counts, not its parameters, and case doesn't matter. `text/json` is JSON and `text/yaml` is YAML.
A content type that isn't exactly `type/subtype`, like `application/json/x` or `text/`, isn't read.

`query` and a form `body` are objects without a prototype. Repeated keys (`foo=a&foo=b`) become
arrays, and so do indexed keys (`foo[]=a` or `foo[2]=a`), with indices up to 99.

When the wrapper read the body, the function gets a new request with the same method, headers, body
bytes and options (signal, redirect mode and so on), so it can still call `json()`, `text()` or
`buffer()`. Otherwise the function gets the original request.

## Options

```javascript
export const main = wrap(run)
  .with(bodyData, { coerceBoolean: true, maxBodySize: 1024 * 1024 });
```

- `coerceBoolean`: turns `'true'` and `'false'` into booleans.
- `coerceInt`: turns integer strings into numbers.
- `coerceNumber`: turns number strings like `-1.5` or `2e3` into numbers.
- `maxBodySize`: the largest body in bytes the wrapper accepts. A bigger body gets a 413. Not set
  means no limit. It only applies to bodies the wrapper parses (JSON, form, YAML, text). A
  `content-length` above the limit is turned down before anything is read. Without one, or when
  it's too small, the wrapper reads the whole body and then checks its size, so the option doesn't
  limit memory. It has to be a non-negative integer; anything else throws when you wrap the
  function.

The coerce options apply to `query` and to form bodies, not to JSON.

## Errors

- 400 with `x-error: error parsing request body`: invalid JSON, JSON that isn't an object or an
  array, or an array index above 99 in the query or in a form body.
- 413 with `x-error: request body too large`: the body is bigger than `maxBodySize`.

The query is checked first, then the size, then the body.

## Migrating from 2.x

In 2.x, `context.data` was either the parsed body or the query parameters, never both. Code that
read `context.data.x` got `x` from the body if there was a JSON or form body (or a YAML body with
`supportYAML`), and from the query otherwise.

- Read `context.data.query.x` or `context.data.body?.x`, depending on where `x` comes from.
- If a parameter can come from either, decide in your code which one wins. To keep the 2.x
  behaviour: `const params = ['json', 'form'].includes(type) ? body : query;`. If you passed
  `supportYAML: true`, add `'yaml'` to that list: 2.x then put the YAML string into `context.data`
  instead of the query.
- YAML bodies are always read now and the `supportYAML` option is gone. The YAML string is in
  `context.data.body`, with `type` set to `yaml`.
- `text/*` bodies are read now. In 2.x they were left alone and `context.data` held the query.
- Content types are matched more strictly. Uppercase form and YAML types are recognised now.
  Parameters no longer count, so a multipart boundary that contains `/json` doesn't make the body
  JSON any more. `application/yamlfoo` is no longer YAML.
- The query is parsed for every request now, so an index above 99 in the query (`?foo[100]=x`)
  also fails JSON, form and YAML requests with a 400.
- 2.x always passed `new Request(request.url, request.init)` to the function. That lost stream
  bodies and turned cloned requests into GET requests without a body. 3.x passes the original
  request, or a copy with the same body bytes when it read the body.
