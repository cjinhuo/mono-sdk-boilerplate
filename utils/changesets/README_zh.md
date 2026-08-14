# changesets-toolkit

这个包为 Changesets 3 提供 CommonJS commit/changelog hook 和版本发布封装。

## 环境要求

- Node.js \`^22.11 || ^24 || >=26\`
- pnpm \`>=11\`
- 使用方项目安装 \`@changesets/cli@^3.0.0\`

## 配置

在 \`.changeset/config.json\` 中配置：

\`\`\`json
{
  "changelog": ["changesets-toolkit/dist/changelog.js", {}],
  "commit": ["changesets-toolkit/dist/commit.js", {}],
  "updateInternalDependencies": "patch"
}
\`\`\`

如需在 changelog 中显示 GitHub 用户名，请将具备仓库读取权限的 token 写入 \`CHANGESET_READ_REPO_TOKEN\` 环境变量；未配置时使用 commit 邮箱兜底。

## Commit 与 changelog hook

\`changeset add\` 会生成类似下面的 commit message：

\`\`\`text
chore(changeset): 🦋 @package-name:patch
\`\`\`

\`changeset version\` 会生成类似下面的 changelog：

\`\`\`md
- feat: 这是测试 @author · 2025-01-01 · [#abc1234](https://github.com/owner/repo/commit/abc1234)
\`\`\`

## changeset_version

\`\`\`sh
changeset_version [--beta] [--filter <glob>] [--git-push | --no-git-push]
\`\`\`

- 首次使用 \`--beta\` 时进入 \`beta\` 预发布模式；后续执行会继续递增，并保留 \`.changeset/pre.json\` 和 \`.changeset/pre/\`。
- Stable 执行发现当前处于预发布状态时，会先自动执行 pre exit。
- \`--filter\` 按包名匹配，但以整个 changeset 文件为处理单位；一个包含多个包的 changeset 不会被拆分。成功或失败后都会恢复临时隐藏的 changeset，启动时也会恢复上次异常遗留。
- 默认不 push。使用 \`--git-push\` 才会推送当前分支；detached HEAD、缺少目标分支或 push 失败都会明确报错。\`--no-git-push\` 用于显式声明不推送。
- 没有待发布 changeset 时，保留 Changesets 3 的退出码 1。

## changeset_publish

\`\`\`sh
changeset_publish [--no-git-tag]
\`\`\`

默认执行 publish、创建 Git tag 并推送 tag。\`--no-git-tag\` 会透传给 Changesets，并跳过 tag 推送。CI 使用 \`changesets/action/publish@v2\` 完成 npm 发布、Git tag 和 GitHub Release；本封装继续用于本地或手动直发。
