# 工具链与兼容性

## 开发基准

使用 Node.js 24.x（固定 24.22.2）和 pnpm 12.16.1。公开 changesets-toolkit 的运行时范围继续保留 Node ^22.11 / ^24 / >=26 与 pnpm >=11；仓库开发工具的最低版本与公开包消费者要求分开维护。

@types/node 使用 24.x 最新兼容版本，对齐开发运行时。pnpm Catalog 统一依赖版本，锁文件固定具体解析。当前 Vite 的可选 YAML peer 使用 2.9.1 override，避免相同 Vite 版本因 peer 不同产生两份模块声明。不要用 skipLibCheck 隐藏这类重复实例错误。minimumReleaseAgeExclude 仅列出此次明确选定的稳定版本；没有全局关闭包发布年龄检查。

## 构建

SDK 直接从 src/index.ts 由 Vite 8 Library Mode 生成 JS；TypeScript 7 CLI 单独生成声明。这样不依赖旧 TypeScript 编译器 API。内部 workspace 依赖通过共享 alias 内联，包不需要安装私有构建工具。

保留 ES2015 SDK 语法目标、现有 API、CJS/ESM/IIFE 文件名、版本 banner 和 `_GLOBAL_` 名称。CommonJS 使用 index.js，新增 index.mjs 作为原生 ESM 入口；条件类型导出分别指向 d.mts/d.cts，旧 ESM 子路径映射仍有效。

IIFE、CJS 和 ESM 发布代码均不注入 Istanbul。单测由 Vitest V8 生成覆盖率；浏览器 E2E 验证行为，不将两种覆盖率混为一谈。

Nx 根据 workspace 依赖决定构建顺序并缓存 dist。pnpm esm 和 build:cjs 保留为兼容命令，但当前统一执行完整构建；esm/ 不再是公开产物或开发依赖。

## 包消费验证

pnpm test:packages 会打包四个 SDK 和 toolkit，在临时目录通过 npm 安装 tarball，再验证：

- require、import 和旧 ESM 子路径的实际导出与返回值。
- 在独立 VM 执行 IIFE，确认不存在覆盖率全局副作用。
- TypeScript Bundler、NodeNext ESM 和 CommonJS 消费以及错误参数的类型拒绝。
- 文档中 CommonJS commit/changelog hooks 的加载与输出。

不会从仓库源码 alias 得出包可用的结论。Playwright 额外在 Chromium、Firefox、WebKit 验证生产 preview、开发服务和实际 IIFE 文件。

## 发布演练

pnpm test:release 使用真实 Changesets 3 CLI 和构建后的 toolkit，在临时 Git 仓库、本地 bare remote 和仅监听 127.0.0.1 的 registry 测试夹具中验证：

- add hook 自动提交和双语 changelog。
- stable、首次 beta、连续 beta 和 beta 转 stable。
- 默认不推送版本；publish 默认推送分支/tag；no-git-tag 不创建或推送 tag。
- 三次真实 npm publish 请求到达本机 registry，版本和 dist-tags 正确。
- 没有待处理 changeset 时保持退出码 1。

registry 夹具只建模此路径使用的 npm metadata GET 和 publish PUT，未建模操作返回 501。它能证明本地命令、HTTP 序列化、版本/tag 与 Git 行为；真实 npm 凭据、权限、2FA 和 GitHub Release 创建由部署后的发布工作流负责。演练不使用真实 npm 发布凭据，不写入公网 registry。

## 已修正的基线问题

原 React 单测期望 reactAdd(1, 2)=3，但源实现一直返回 6；保持实现行为并修正断言。旧 SDK 运行时依赖包含不存在的 @mono/rollup，现已删除。共享包现在也生成声明的 dist 产物；private 字段统一为布尔值。

## 格式化边界

Changeset Markdown 的 YAML frontmatter 由 Changesets 管理，对这些文件禁用 Biome formatter，避免 Markdown 格式化改写发布元数据。仓库技能文件也不参与批量格式化。

## 日常升级

先更新 Catalog 和 packageManager，再安装、检查新增生命周期脚本并运行完整 verify。构建插件随 Vite 一起升级。Vitest 与 coverage-v8 使用完全相同的版本。涉及公开 toolkit 的运行时改动时补充 changeset，并保留现有 hook/CLI 路径。

## 验收记录（2026-11-05）

在 Node.js 24.22.2、pnpm 12.16.1 下，从不含 node_modules 和构建输出的临时副本执行 frozen install、clean、verify，完整通过：

| 检查         | 结果                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| Biome        | 100 个文件，无错误和警告                                                      |
| TypeScript   | 12 个 Nx 任务及根测试/配置检查通过，未跳过声明检查                            |
| Vitest       | 10 个文件、23 个测试通过，并生成覆盖率报告                                    |
| 构建         | 7 个目标全部通过，验证时禁用 Nx 缓存                                          |
| tarball 消费 | 20 项通过，包括安装后的两个 CLI bin                                           |
| 浏览器       | Chromium / Firefox / WebKit 共 12 项通过                                      |
| 发布演练     | stable → beta.0 → beta.1 → stable，三次本机 registry 写入及 tag/push 验证通过 |
| 工作流       | actionlint 1.7.12 检查通过                                                    |
| 开发命令     | watch 实际源码变化后的重建、提交消息 hook 的合法/非法输入均通过               |

四个 SDK 的 src/index.ts 实现没有改动。GitHub 托管 CI 和正式 npm 发布未在本次本地验收中触发；发布流程的本地演练不等同于线上权限验证。
