# AI Review

`.github/workflows/ai-review.yml` is a reusable workflow that reviews pull requests with Claude and Codex, both on Amazon Bedrock. It is adapted from the review jobs of [ai-ecoverse/slicc-shared-web's pipeline](https://github.com/ai-ecoverse/slicc-shared-web/blob/main/.github/workflows/pipeline.yml), without the slicc browser harness.

What sets it apart from a plain `claude-code-action` review:

- **The reviewers read the test results.** The `tests` job runs your test command on the pull request's head and on its base, and gives the reviewers both logs, the exit codes and the report files (JUnit, coverage), so they can tell a regression from a test that already failed.
- **The reviewers work in a debuggable environment.** Both trees are checked out with dependencies installed, so a reviewer can re-run a single test, diff behaviour between head and base, and, with `browsers: true`, drive Playwright Chromium on a virtual display.
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
| `browsers` | `false` | Installs Playwright Chromium and starts Xvfb, for the tests and the reviewers |
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

## Test reports

Most runners can write JUnit next to their usual output:

- `node --test`: `npm test -- --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination="$REVIEW_RESULTS/junit.xml"`
- `@web/test-runner`: add `junitReporter()` from `@web/test-runner-junit-reporter` (writes `test-results.xml`)
- `mocha`: `mocha-multi-reporters` with `mocha-junit-reporter`
