# Mono SDK Boilerplate

用于 TypeScript SDK 的 pnpm monorepo 示例，包含浏览器 SDK、React demo 和 `changesets-toolkit` 发布工具。

## 技术栈

开发基准为 **Node.js 24.x**，`.node-version` 与 `.nvmrc` 固定为 **24.22.2**；`packageManager` 固定 pnpm **12.16.1**。

| 职责                 | 工具                                    |
| -------------------- | --------------------------------------- |
| workspace、依赖版本  | pnpm workspace + Catalog                |
| 构建顺序与缓存       | Nx 24                                   |
| SDK 与应用构建       | Vite 8，内置 Rolldown                   |
| 类型检查与声明       | TypeScript 7                            |
| lint、格式与导入整理 | Biome 2.6                               |
| 单测与覆盖率         | Vitest 5 + V8                           |
| 浏览器验证           | Playwright，Chromium / Firefox / WebKit |
| 版本与发布           | Changesets 3 + changesets-toolkit       |

具体版本统一维护在 `pnpm-workspace.yaml`，提交锁文件保证安装可复现。

## 安装与启动

```sh
nvm install
nvm use
npm install --global --allow-scripts=pnpm pnpm@12.16.1
pnpm install --frozen-lockfile
pnpm web:dev
```

`pnpm web:dev` 启动 React demo；`pnpm e2e:dev` 启动 core demo，默认端口 6060。应用通过共享 Vite alias 读取 SDK 源码，修改 SDK 可直接热更新。

## 常用命令

| 命令                            | 作用                                                                |
| ------------------------------- | ------------------------------------------------------------------- |
| `pnpm build`                    | 按 shared → core → web → react 的依赖顺序构建，再构建依赖它们的应用 |
| `pnpm watch:esm`                | 监听源码变化，按依赖图重建并复用缓存                                |
| `pnpm typecheck`                | 检查生产代码、测试代码和工具配置                                    |
| `pnpm lint` / `pnpm lint:fix`   | 检查 / 修复 Biome 问题                                              |
| `pnpm test` / `pnpm test:watch` | 单测 / 监听单测                                                     |
| `pnpm test:coverage`            | 单测和 V8 覆盖率，报告在 coverage/                                  |
| `pnpm test:packages`            | 打包并在仓库外安装，验证 JS、类型和 hooks                           |
| `pnpm test:e2e`                 | 在三种浏览器检查生产 demo、开发服务和 IIFE                          |
| `pnpm test:release`             | 在临时 Git 仓库和本机 registry 中演练版本与发布                     |
| `pnpm verify`                   | 执行完整验收链路                                                    |
| `pnpm clean`                    | 清理构建、覆盖率和浏览器报告                                        |
| `pnpm exec nx graph`            | 查看包依赖图                                                        |

首次执行浏览器测试前安装浏览器：

```sh
pnpm --filter @mono/e2e exec playwright install chromium firefox webkit
pnpm verify
```

Linux CI 使用 `playwright install --with-deps chromium firefox webkit` 安装系统依赖。包消费检查需要从 npm 下载公开运行时依赖；发布演练的写入只发生在本机 registry 和临时 Git remote。

## 包和构建产物

```text
packages/shared → packages/core → packages/web → packages/react
                                           ↘ React demo
utils/tsconfig       共享 TypeScript 配置
utils/vite           共享 Vite 配置
utils/changesets     公开发布的 changesets-toolkit
scripts              清理、产物消费和发布验收
```

SDK 示例包保留 private 状态。每个包生成：

| 文件                           | 用途                                   |
| ------------------------------ | -------------------------------------- |
| dist/index.js                  | 保留原 CommonJS 入口                   |
| dist/index.esm.js              | 保留原浏览器 / bundler ESM 文件名      |
| dist/index.min.js              | 保留原 IIFE 文件名和 `_GLOBAL_` 全局名 |
| dist/index.d.ts                | 保留原声明入口                         |
| dist/index.mjs                 | 无歧义的原生 ESM 入口                  |
| dist/index.d.mts / index.d.cts | 分别用于 ESM / CommonJS 类型解析       |

`import '@mono/core'` 和 `require('@mono/core')` 通过条件导出选择正确产物；旧的 `@mono/core/dist/index.esm.js` 子路径继续可用。IIFE 文件名沿用历史命名，默认保留可读代码，不承诺 min.js 的压缩率。构建不再输出生产用途的 esm/ 中间目录，也不再往发布文件插入覆盖率代码。

## 开发与发布

安装 VS Code 的 Biome 扩展即可使用保存格式化。Husky 在安装时初始化，提交前检查暂存文件，提交消息遵循 Conventional Commits。

发布文档见 [changesets-toolkit 中文说明](utils/changesets/README_zh.md)，迁移决策、兼容性和验收方式见 [工具链说明](docs/toolkit.md)。
