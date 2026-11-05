# Contributing

## Environment

Use Node.js 24.x, pinned to 24.22.2 in `.node-version`, and pnpm 12.16.1 from `packageManager`.

```sh
pnpm install --frozen-lockfile
pnpm --filter @mono/e2e exec playwright install chromium firefox webkit
pnpm verify
```

The verification chain checks Biome, production/test/config types, unit coverage, all builds, packed consumers, browser behavior, and release orchestration. Run `pnpm clean` before a clean build. Nx caches package outputs and respects workspace dependencies.

## Changes

Keep SDK APIs and the existing dist/index.js, index.esm.js, index.min.js and index.d.ts paths compatible. Update packed-consumer and browser checks when intentionally extending public behavior. Keep dependency versions in pnpm-workspace.yaml catalogs and commit pnpm-lock.yaml.

Use Biome for formatting and linting. Husky runs lint-staged on commit and commitlint on the message. Commit only the intended files before running `pnpm commit`.

## Release notes

Only changesets-toolkit is currently public. Changes affecting its runtime or published files need a changeset; private SDK examples, documentation, tests, and CI alone do not. Follow the repository changeset-generator skill for bilingual summaries and automatic commit hooks.

Release workflows are manually triggered. They run verification before versioning, rebuild after the version commit, and publish through the existing wrapper. See utils/changesets/README.md for flags and authentication.
