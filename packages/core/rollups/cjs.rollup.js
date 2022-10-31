const { getBasicPlugins, getBasicOutput } = require('@mono/rollup')
const { join, resolve } = require('path')
const currentPackageDir = join(__dirname, '..')
const input = resolve(currentPackageDir, 'esm/index.js')
const packageDirDist = `${currentPackageDir}/dist`
const { name, version } = require('../package.json')

const config = {
  input,
  external: [],
  output: {
    file: `${packageDirDist}/index.js`,
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
    ...getBasicOutput({ name, version }),
  },
  plugins: getBasicPlugins(),
}

module.exports = config
