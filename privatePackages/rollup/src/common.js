const commonjs = require('@rollup/plugin-commonjs')
const cleanup = require('rollup-plugin-cleanup')
const size = require('rollup-plugin-sizes')
const alias = require('@rollup/plugin-alias')
const json = require('@rollup/plugin-json')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const { join, resolve } = require('path')

const packagesRoot = resolve(__dirname, '../../../packages')
const aliasConfig = alias({
  entries: [{ find: /^@mono\/core$/, replacement: join(packagesRoot, 'core', 'esm') }],
  entries: [{ find: /^@mono\/web$/, replacement: join(packagesRoot, 'web', 'esm') }],
  entries: [{ find: /^@mono\/react$/, replacement: join(packagesRoot, 'react', 'esm') }],
  entries: [{ find: /^@mono\/shared$/, replacement: join(packagesRoot, 'shared', 'esm') }],
})

function getBasicPlugins(aliasPlguin = aliasConfig) {
  return [
    aliasPlguin,
    nodeResolve(),
    size(),
    commonjs({
      exclude: 'node_modules',
    }),
    json(),
    cleanup({
      comments: 'none',
    }),
  ]
  // 外部依赖，也是防止重复打包的配置
  // external: [],
}
module.exports = {
  getBasicPlugins,
}
