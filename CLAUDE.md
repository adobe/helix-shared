# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is an npm workspaces **monorepo** of shared libraries for Project Helix. Each subdirectory of `packages/` is an independently-versioned, independently-published package under `@adobe/helix-shared-*` (e.g. `@adobe/helix-shared-config`, `@adobe/helix-shared-utils`, `@adobe/helix-shared-storage`). Packages are ESM-only (`"type": "module"`) and may depend on each other via the `^` range.

Don't add a top-level `@adobe/helix-shared` package — it was retired. Consumers import the specific sub-package they need.

## Common commands

Run from the repo root unless noted:

- `npm install` — install all workspace deps
- `npm test` — run tests across every workspace (`npm test --workspaces`)
- `npm run lint` — lint every workspace
- `npm run docs` — regenerate `docs/` (JSON-schema markdown + JSDoc API)

Per-package work (run inside `packages/<name>/`, or pass `--workspace=@adobe/helix-shared-<name>` from root):

- `npm test` — `c8 mocha` with coverage; tests live in `test/*.test.js` and use `test/setup-env.js` as a mocha `--require` hook
- `npm run lint` — `eslint .`
- Single test file: `npx mocha test/SomeThing.test.js`
- Single test by name: `npx mocha test/SomeThing.test.js -g "partial title"`
- Auto-fix lint: `npx eslint . --fix`

## Releases

Each package releases independently via **semantic-release** with `semantic-release-monorepo` (see `.releaserc.cjs`). Versions are derived from Conventional Commits on `main`:

- `fix:` → patch, `feat:` → minor, `BREAKING CHANGE:` footer → major
- `chore(release): ...` commits with `[skip ci]` are made by the release bot — do not author these manually
- Husky + `lint-staged` run `eslint` on staged `*.js` at commit time

## Packages

Most packages are middleware "wrappers" composed via `@adobe/helix-shared-wrap`'s `.with()` chain on a main handler. A few (`config`, `git`, `storage`, `string`, `utils`, `async`, `process-queue`, `prune`, `tokencache`, `indexer`) are plain libraries.

- **helix-shared-async** — Tiny async primitives (`sleep(ms)`, `nextTick()`). Used to yield to the event loop or pause within async flows.
- **helix-shared-body-data** — Wrap middleware that parses form/JSON request bodies (POST/PUT) and exposes them on `context.data` for Helix Universal serverless functions.
- **helix-shared-bounce** — Wrap middleware that races a "fast" responder against the slow main handler and returns whichever finishes first; the slow side keeps running via fetch so it isn't aborted. Supports a `debounce` predicate to skip bouncing per request.
- **helix-shared-config** — Loads, validates, and exposes Helix YAML configs (`helix-config.yaml`, `helix-fstab.yaml`, `helix-query.yaml`, `helix-markup.yaml`) via JSON Schema. The largest package; see "Architecture notes" below.
- **helix-shared-git** — `GitUrl` class that parses, normalizes, and re-emits Git URLs with `protocol/hostname/owner/repo/ref/path`. Used everywhere Helix needs to identify a repo+ref.
- **helix-shared-ims** — Wrap middleware that authenticates requests against Adobe IMS (stage/prod) and exposes `context.ims.profile`. Configurable scope, `forceAuth` for required-auth endpoints.
- **helix-shared-indexer** — HTML-to-record indexer driven by `helix-query.yaml` `indices` config. Resolves CSS selectors, applies value/values expressions (`textContent`, `attribute`, `match`, etc.) to produce queryable records.
- **helix-shared-process-queue** — Bounded-concurrency async task runner. Takes a list of tasks plus a worker fn; returns aggregated results, with optional access to in-progress results inside the worker.
- **helix-shared-prune** — `pruneEmptyValues(obj)` recursively strips falsy values and empty arrays from an object in place. Returns `null` when everything is removed; used to keep configs/payloads tidy.
- **helix-shared-secrets** — Wrap middleware that loads secrets (currently AWS Secrets Manager) named `<package>/<function>` into `context` and `process.env` before the handler runs. Supports a custom `nameFunction` for non-default paths.
- **helix-shared-server-timing** — Wrap middleware that injects a `timer` onto `context`; `timer.update(label)` records milestones and the response automatically gets a `Server-Timing` header.
- **helix-shared-storage** — `HelixStorage` client over AWS S3 and Cloudflare R2 with `bucket(name).get/put/...`. Most consumers create it from the Helix function `context` rather than direct credentials.
- **helix-shared-string** — String helpers: `multiline` (template-string dedent), `splitByExtension`, `sanitizeName`, `sanitizePath`, `editDistance`. Plain functions, no dependencies.
- **helix-shared-tokencache** — Layered (memory + persistent) cache plugins for OAuth tokens, with `getCachePlugin` auto-discovering storage at `helix-content-bus/<id>/.helix-auth`, `helix-code-bus/<owner>/.helix-auth`, or a default fallback. Used for OneDrive and similar long-lived auth.
- **helix-shared-utils** — Backend-response status mapping (`propagateStatusCode`, `logLevelForStatusCode` — e.g. 500→502, 429→503), header sanitization, and other small gateway utilities. Imported by most other packages.
- **helix-shared-wrap** — The composition primitive: `wrap(main).with(a).with(b)` produces a handler where the **last** wrapper added runs **first**. All other wrap-based middleware in this repo plugs into this.

## Architecture notes

- **`helix-shared-config`** is the largest package and the historical heart of the repo. It loads, validates, and exposes Helix YAML configs (`helix-config.yaml`, `helix-fstab.yaml`, `helix-query.yaml`, `helix-markup.yaml`). It uses a `SchemaDerivedConfig` base that drives object construction from JSON Schemas in `src/schemas/`; validation errors flow through `ValidationError.js`. Handlers like `MountPointHandler`, `SitemapHandler`, `NamedMapHandler` translate validated schema fragments into runtime objects. `fetchconfig/` retrieves configs from remote sources (GitHub, etc.) with caching. The `docs:schema` script regenerates `docs/*.md` from these schemas — re-run it after schema changes.
- **Builder/fluent API pattern**: classes like `HelixConfig` use `.withSource(yaml)` / `.withJSON(obj)` / `.withDirectory(path)` followed by `await .init()`. Preserve this shape in additions.
- **HTTP**: tests pin `HELIX_FETCH_FORCE_HTTP1=true` (set in `test/setup-env.js`) for determinism with `nock` and `@pollyjs`. Don't remove that without a plan.
- **Cross-package imports** must use the published name (`@adobe/helix-shared-utils`), never a relative `../helix-shared-utils/...` path — the workspace symlink makes both work locally but only the former works after publish.

## ESLint config

Each package extends the root `eslint.config.js`, which composes `@adobe/eslint-config-helix`'s `recommended`, `source`, and `test` configs. Test files use the `test` config (looser globals, etc.) — keep test code under `test/`.
