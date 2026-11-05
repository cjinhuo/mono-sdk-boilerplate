# Workspace 工具

- `tsconfig/`：SDK 的严格 TypeScript 7 基础配置；测试与 Node CLI 分别使用独立配置。
- `vite/`：SDK Library Mode 和应用源码 alias 的共享配置，构建使用 Vite 8 内置 Rolldown。
- `changesets/`：公开包 changesets-toolkit，保留 CommonJS hooks 和 CLI 路径。

旧的 batch-rollup 包已被共享 Vite 配置替代。运行命令和环境要求见 [根 README](../README.md)。
