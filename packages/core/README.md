# @mono/core

核心算术与类型判断。此包是 private workspace 示例，不会被发布工作流发布。

## 使用

```ts
import { coreAdd, coreIsString, CoreConstant } from '@mono/core'

coreAdd(1, 2) // 3
coreIsString('hello') // true
CoreConstant // 'Constant'
```

CommonJS 可使用 `require('@mono/core')`。浏览器可通过 script 标签加载 `dist/index.min.js`，导出位于 `_GLOBAL_`。

## 开发与验证

在仓库根目录执行：

```sh
pnpm exec nx run @mono/core:build
pnpm --filter @mono/core test
```

上述 Nx 命令会先构建依赖；构建整个 workspace 使用 `pnpm build`。子包的 `watch:esm` 转发到根监听器，同时维护 JS 与类型产物。应用开发由 Vite 读取源码；包消费检查使用实际 tarball，运行 `pnpm test:packages` 前先完成构建。

产物格式、类型入口和完整验收命令见 [根 README](../../README.md)。
