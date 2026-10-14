# Lambda workflow template

`lambda.yaml` is a `workflow_call` reusable workflow that builds, tests and
deploys a Lambda service. Each repo keeps a thin caller workflow (its own
`.github/workflows/main.yaml`) that `uses:` this template and passes inputs;
all generic CI/CD logic lives here so any released version can be deployed
to any AWS account (prod or the dormant secondary/DR account) without
per-repo hardcoding.

## Inputs

| Input | Type | Default | Description | Mode |
|---|---|---|---|---|
| `mode` | string | `'ci'` | `'ci'` (test + test-deploy/release) or `'deploy'` (deploy to a target account) | both |
| `ref` | string | `''` | Tag or branch to check out | `deploy` (required there) |
| `account-id` | string | `''` | Target AWS account ID for `test-deploy` and `deploy`; empty = default prod account (`118435662149`); `release` always uses the prod account | `test-deploy`, `deploy` |
| `region` | string | `''` | Target AWS region for `test-deploy` and `deploy`; empty = default (`us-east-1`); `release` always uses `us-east-1` | `test-deploy`, `deploy` |
| `lambda-role` | string | — (required) | Lambda execution role name, exported as `HLX_LAMBDA_ROLE` | both |
| `node-version` | string | `'24.x'` | Node.js version for `setup-node` | both |
| `lint` | boolean | `true` | Run `npm run lint` in the `test` job | `ci` |
| `codecov` | boolean | `true` | Upload coverage via `codecov-action` in the `test` job | `ci` |
| `release-dry-run` | boolean | `true` | Run `semantic-release-dry` in `test-deploy` | `ci` (branch) |
| `unit-tests` | boolean | `false` | Also run the `test` job | `deploy` |
| `post-deploy-tests` | boolean | `false` | Run post-deploy integration tests | `deploy` |
| `pre-deploy-command` | string | `''` | Shell command run right before deploying | both (deploying jobs) |
| `env-secrets` | string | `''` | Space-separated names of caller repo secrets to export as env vars | both (deploying jobs) |

Callers invoke with `secrets: inherit`; there is no `secrets:` block on the
`workflow_call` definition.

## Fixed values

These are hardcoded in the template, not exposed as inputs:

- Deploy role name: `helix-gh-deploy-config-service`
- Default AWS account: `118435662149` (default for `test-deploy`/`deploy`; fixed for `release`, which always deploys to prod)
- Default AWS region: `us-east-1` (default for `test-deploy`/`deploy`; fixed for `release`, which always deploys to `us-east-1`)
- AWS secret: `,/helix/github-action-secrets` (leading comma = keys exported
  without a prefix; no "unprefix" loop needed)
- Release branch: `main`
- `CI_BUILD_NUM` = `${{ github.run_id }}`, `CI_BRANCH` = `${{ github.ref_name }}`

## Jobs / flows

| Trigger | `mode` | Jobs |
|---|---|---|
| push to a feature branch | `ci` | `test` → `test-deploy` (uses `account-id`/`region`, defaults `118435662149`/`us-east-1`) |
| push to `main` | `ci` | `test` → `release` (always deploys to prod `118435662149`/`us-east-1`) |
| `dr-env` dispatcher | `deploy` | `deploy` (+ `test` if `unit-tests`) (uses `account-id`/`region`, defaults `118435662149`/`us-east-1`) |
| manual run from GitHub UI | chosen (`ci` default) | as above |

## Setup action

`.github/actions/lambda-setup/action.yml` is a composite action that
factors out the steps shared by the `test`, `test-deploy`, `release` and
`deploy` jobs: checkout, Node.js setup, `.npmrc`/`npm ci`, and — when an
`aws-account-id` is given — the lambda-role check, AWS credentials,
fetching the shared AWS secret, exporting any `env-secrets`, and running
`pre-deploy-command`. All four jobs in `lambda.yaml` use it via a single
`Setup` step.

It is referenced as `adobe/helix-shared/.github/actions/lambda-setup@vhs/workflow-template`
(a `./` path would resolve against the caller repo, not this one) and must
always be referenced with the same ref as `lambda.yaml`, since the
workflow's jobs depend on this exact version of the action.

## Required caller permissions

The caller workflow must grant:

```yaml
permissions:
  id-token: write
  contents: write
  issues: read
  pull-requests: write
```

## Override mechanisms

- **`pre-deploy-command`** — a single shell command hook run right before
  the deploy step on the same runner, for repo-specific prep (e.g. bot's
  `SETUP_URL`, token-authorizer's `params.json`).
- **`env-secrets`** — space-separated names of repo secrets (combined with
  `secrets: inherit`) that get exported as env vars for the deploying steps,
  for repos that need extra secrets beyond the standard set.
- **Extra jobs in the caller's `main.yaml`** — anything not generic across
  all repos (e.g. admin/api's `docs:lint`, `test:bundle`, docs publishing)
  should be added as additional jobs in the caller workflow rather than as
  template inputs.

## `package.json` requirements for callers

Caller repos must define these npm scripts:

- `test`
- `lint`
- `deploy`
- `deploy-ci` — should use `$CI_BUILD_NUM` for the branch deployment suffix
- `deploy-routes`
- `semantic-release`
- `test-postdeploy` (optional, run with `--if-present`)
- `semantic-release-dry` (optional, run with `--if-present`)

And the Lambda role must be wired through the environment so the template
can control it:

```json
"awsRole!important": "${env.HLX_LAMBDA_ROLE}"
```
