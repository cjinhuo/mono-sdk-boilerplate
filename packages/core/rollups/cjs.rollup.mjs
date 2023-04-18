import { getBasicPlugins, getBasicOutput, getDirName } from '@mono/rollup'
import { resolve, join } from 'path'
import { createRequire } from 'node:module'

const currentPackageDir = getDirName()
const input = resolve(currentPackageDir, 'esm/index.js')
const packageDirDist = join(currentPackageDir, '../../', 'dist')
const { name, version } = createRequire(import.meta.url)('../package.json')

const config = {
  input,
  external: [],
  output: {
    file: `${packageDirDist}/index.js`,
    format: 'cjs',
    sourcemap: false,
    exports: 'named',
    ...getBasicOutput({ name, version }),
  },
  plugins: getBasicPlugins(),
}

export default config
