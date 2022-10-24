const json = require('@rollup/plugin-json')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const { terser } = require('rollup-plugin-terser')
const clear = require('rollup-plugin-clear')
const cleanup = require('rollup-plugin-cleanup')
const size = require('rollup-plugin-sizes')
const path = require('path')

const input = path.resolve(__dirname, 'esm/index.js')
const packageDirDist = `${__dirname}/dist`
const { name, version } = require('./package.json')
const annotation = `/* ${name} version:${version} */`
function getCommon() {
  const common = {
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
const esmPackage = {
  ...common,
  output: {
    file: `${packageDirDist}/index.esm.js`,
    format: 'es',
    sourcemap: true,
    ...common.output,
  },
  plugins: [
    ...common.plugins,
    clear({
      targets: [packageDirDist],
    }),
  ],
}
const cjsPackage = {
  ...common,
  external: [],
  output: {
    file: `${packageDirDist}/index.js`,
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
    ...common.output,
  },
  plugins: [...common.plugins],
}

const iifePackage = {
  ...common,
  external: [],
  output: {
    file: `${packageDirDist}/index.min.js`,
    format: 'iife',
    name: '_GLOBAL_',
    exports: 'named',
    ...common.output,
  },
  plugins: [...common.plugins, terser()],
}

module.exports = [esmPackage, iifePackage, cjsPackage]
