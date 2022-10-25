import type { RollupOptions } from 'rollup'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import clear from 'rollup-plugin-clear'
import cleanup from 'rollup-plugin-cleanup'
import size from 'rollup-plugin-sizes'
import path from 'path'
import { isString } from '@mono/shared'
console.log('alias aliasaliasalias ', isString)
const input = path.resolve(__dirname, 'esm/index.js')
const packageDirDist = `${__dirname}/dist`
const { name, version } = require('./package.json')
const annotation = `/* ${name} version:${version} */`
function getCommon() {
  const common: RollupOptions = {
    input,
    output: {
      banner: annotation,
      footer: '/* follow me on Github! @cjinhuo */',
      globals: {},
    },
    // 外部依赖，也是防止重复打包的配置
    external: [],
    plugins: [
      nodeResolve(),
      size(),
      commonjs({
        exclude: 'node_modules',
      }),
      json(),
      cleanup({
        comments: 'none',
      }),
    ],
  }
  return common
}

const common = getCommon()
const esmPackage: RollupOptions = {
  ...common,
  output: {
    file: `${packageDirDist}/index.esm.js`,
    format: 'es',
    sourcemap: true,
    ...common.output,
  },
  plugins: [
    ...(common.plugins as []),
    clear({
      targets: [packageDirDist],
    }),
  ],
}
const cjsPackage: RollupOptions = {
  ...common,
  external: [],
  output: {
    file: `${packageDirDist}/index.js`,
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
    ...common.output,
  },
  plugins: [...(common.plugins as [])],
}

const iifePackage: RollupOptions = {
  ...common,
  external: [],
  output: {
    file: `${packageDirDist}/index.min.js`,
    format: 'iife',
    name: '_GLOBAL_',
    exports: 'named',
    ...common.output,
  },
  plugins: [...(common.plugins as []), terser()],
}

export default [esmPackage, iifePackage, cjsPackage]
