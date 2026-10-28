# AI Review

`.github/workflows/ai-review.yml` is a reusable workflow that reviews pull requests with Claude and Codex, both on Amazon Bedrock. It is adapted from the review jobs of [ai-ecoverse/slicc-shared-web's pipeline](https://github.com/ai-ecoverse/slicc-shared-web/blob/main/.github/workflows/pipeline.yml), without the slicc browser harness.

What sets it apart from a plain `claude-code-action` review:

- **The reviewers read the test results.** The `tests` job runs your test command on the pull request's head and on its base, and gives the reviewers both logs, the exit codes and the report files (JUnit, coverage), so they can tell a regression from a test that already failed.
- **The reviewers work in a debuggable environment.** Both trees are checked out with dependencies installed, so a reviewer can re-run a single test and diff behaviour between head and base. With `browsers: true`, each tree gets its own headed Chrome for Testing on a virtual display with CDP enabled (head on `127.0.0.1:9301`, base on `9302`), driven by [slicc-cdp](https://github.com/ai-ecoverse/slicc-cdp)'s `playwright-cli` and `curlwright`.
- **Test environments.** The `environment` hook brings up whatever the repository needs in each tree (a dev server, fixtures, a local Worker), and the workflow opens it in that tree's browser, so a reviewer can compare the running head with the running base.
- **Structured verdicts.** Each agent answers with JSON (verdict, summary, line comments, follow-up issues). `post` turns that into a `review / <agent>` status, a sticky summary comment, line comments and issues; the `review` job fails unless every agent approved.

## Usage

```yaml
# .github/workflows/ai-review.yml
name: AI Review

on:
  pull_request:

concurrency:
  group: ai-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  ai-review:
    uses: adobe/helix-shared/.github/workflows/ai-review.yml@main
    secrets:
      AWS_BEARER_TOKEN_BEDROCK: ${{ secrets.AWS_BEARER_TOKEN_BEDROCK }}
    permissions:
      contents: read
      issues: write
      pull-requests: write
      statuses: write
    with:
      test: npm test
```

The calling repository needs an `AWS_BEARER_TOKEN_BEDROCK` secret: a Bedrock API key with access to the models below. Pull requests from forks get no secrets, so they aren't reviewed; the `review` check warns instead of failing.

## Inputs

| Input | Default | What it does |
| --- | --- | --- |
| `setup` | `npm ci` | Installs dependencies, in the head and in the base tree |
| `test` | `npm test` | Runs the tests in both trees; empty skips the `tests` job. `$REVIEW_RESULTS` is a directory for extra report files |
| `test-results` | `junit.xml`, `test-results.xml`, `coverage/lcov.info`, `coverage/coverage-summary.json`, `lcov.info` | Globs of report files to hand to the reviewers |
| `test-timeout-minutes` | `20` | Time limit for each test run |
| `browsers` | `false` | Installs Chrome for Testing (via slicc-cdp) and starts Xvfb. In the tests job `CHROME_PATH` points at it; the reviewers get one headed Chrome per tree with CDP enabled, plus `playwright-cli` and `curlwright` |
| `chrome` | – | Chrome for Testing version or milestone; empty is the current stable |
| `environment` | `npm run --if-present review:env` | Hook that brings up a test environment in each tree; see below |
| `environment-timeout-seconds` | `120` | How long to wait for each environment's URL to answer |
| `staging-url`, `base-url` | – | Where the head and the base are deployed, e.g. `https://${{ github.head_ref }}--<repo>--adobe.aem.page` |
| `review-prompt` | – | Repository-specific instructions appended to the prompt |
| `review-renovate` | – | Globs of Renovate branch slugs that still get reviewed; other Renovate pull requests are skipped |
| `agents` | `["claude","codex"]` | Which reviewers run |
| `claude-model` | `global.anthropic.claude-opus-5-5` | Also settable with the `AI_REVIEW_CLAUDE_MODEL` variable |
| `codex-model` | `global.openai.gpt-6.1-sol` | Also settable with the `AI_REVIEW_CODEX_MODEL` variable |
| `aws-region` | `us-west-2` | Also settable with the `AI_REVIEW_AWS_REGION` variable |
| `runs-on` | `ubuntu-latest` | Runner for every job |
| `node-version` | `24` | |
| `review-timeout-minutes` | `60` | |

## Test environments

The `environment` hook runs in each tree (head, then base) after setup, in the reviewer jobs. It gets:

| Variable | |
| --- | --- |
| `REVIEW_SIDE` | `head` or `base` |
| `REVIEW_PORT` | a free port for this tree: `8801` for the head, `8802` for the base |
| `REVIEW_CDP` | this tree's browser (`http://127.0.0.1:9301` or `:9302`), with `browsers: true` |
| `REVIEW_ENV_DIR` | a directory for its logs, shown to the reviewers |

It should start long-running processes in the background (`nohup … &`) and return. It can write the URL to open to `$REVIEW_ENV_DIR/url`: the workflow waits until it answers and opens it in the tree's browser. Whatever it writes to `$REVIEW_ENV_DIR/notes.md` (test accounts, fixtures, what to try) goes into the prompt.

The default runs the package's `review:env` script, so a repository can keep the hook in `package.json`. A script that only exists in the head doesn't run in the base, so while a pull request introduces it, pass the hook as the `environment` input instead. For example, a server with fake data:

```yaml
    with:
      browsers: true
      environment: |
        PORT=$REVIEW_PORT nohup node scripts/dev-server.mjs > "$REVIEW_ENV_DIR/server.log" 2>&1 &
        echo "http://localhost:$REVIEW_PORT/" > "$REVIEW_ENV_DIR/url"
```

## Test reports

Most runners can write JUnit next to their usual output:

- `node --test`: `npm test -- --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination="$REVIEW_RESULTS/junit.xml"`
- `@web/test-runner`: add `junitReporter()` from `@web/test-runner-junit-reporter` (writes `test-results.xml`)
- `mocha`: `mocha-multi-reporters` with `mocha-junit-reporter`
