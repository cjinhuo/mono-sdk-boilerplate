import { getBasicPlugins, getBasicOutput } from '@mono/rollup'
import { join, resolve } from 'path'
const __dirname = resolve()
const currentPackageDir = join(__dirname)
const input = resolve(currentPackageDir, 'esm/index.js')
const packageDirDist = `${currentPackageDir}/dist`
import { createRequire } from 'node:module'
const _require = createRequire(import.meta.url)
const { name, version } = _require('../package.json')

const config = {
  input,
  external: [],
  output: {
    file: `${packageDirDist}/index.min.js`,
    format: 'iife',
    sourcemap: true,
    name: '_GLOBAL_',
    exports: 'named',
    ...getBasicOutput({ name, version }),
  },
  plugins: getBasicPlugins(),
}
export default config
