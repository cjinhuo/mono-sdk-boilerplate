# changesets-toolkit

[中文 README](./README_zh.md)

This package supplies CommonJS commit/changelog hooks and release wrappers for Changesets 3.

## Requirements

- Node.js \`^22.11 || ^24 || >=26\`
- pnpm \`>=11\`
- \`@changesets/cli@^3.0.0\` installed by the consuming project

## Configuration

Configure \`.changeset/config.json\`:

\`\`\`json
{
  "changelog": ["changesets-toolkit/dist/changelog.js", {}],
  "commit": ["changesets-toolkit/dist/commit.js", {}],
  "updateInternalDependencies": "patch"
}
\`\`\`

Set \`CHANGESET_READ_REPO_TOKEN\` to a GitHub token with repository read access if changelog entries should use GitHub usernames. Without it, the commit email is used.

## Commit and changelog hooks

\`changeset add\` creates a commit message such as:

\`\`\`text
chore(changeset): 🦋 @package-name:patch
\`\`\`

\`changeset version\` writes changelog entries such as:

\`\`\`md
- feat: this is a test @author · 2025-01-01 · [#abc1234](https://github.com/owner/repo/commit/abc1234)
\`\`\`

## changeset_version

\`\`\`sh
changeset_version [--beta] [--filter <glob>] [--git-push | --no-git-push]
\`\`\`

- The first \`--beta\` run enters the \`beta\` prerelease mode. Later runs continue that prerelease and keep \`.changeset/pre.json\` plus \`.changeset/pre/\`.
- A stable run automatically exits an active prerelease before versioning.
- \`--filter\` matches package names but applies to the whole changeset file. A changeset that releases multiple packages is never split. Hidden changesets are restored after success or failure, and leftovers from an interrupted run are recovered at startup.
- Git push is disabled by default. \`--git-push\` pushes the current branch and reports detached-head, missing-target, or push errors. \`--no-git-push\` is an explicit no-push form.
- Changesets 3 exit code 1 is preserved when there are no unreleased changesets.

## changeset_publish

\`\`\`sh
changeset_publish [--no-git-tag]
\`\`\`

The default command publishes, creates tags, and pushes them. \`--no-git-tag\` forwards the option to Changesets and skips tag pushing. CI uses \`changesets/action/publish@v2\` for npm publishing, Git tags, and GitHub Releases; this wrapper remains available for local/manual publishing.
