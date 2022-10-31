import { getBasicPlugins, getBasicOutput } from '@mono/rollup'
import { join, resolve } from 'path'
import { createRequire } from 'node:module'

const __dirname = resolve()
const currentPackageDir = join(__dirname)
const input = resolve(currentPackageDir, 'esm/index.js')
const packageDirDist = `${currentPackageDir}/dist`
const { name, version } = createRequire(import.meta.url)('../package.json')

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

export default config
