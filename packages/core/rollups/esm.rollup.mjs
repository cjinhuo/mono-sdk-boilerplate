import { getBasicPlugins, getBasicOutput } from '@mono/rollup'
import { join, resolve } from 'path'
const __dirname = resolve()
const currentPackageDir = join(__dirname)
const input = resolve(currentPackageDir, 'esm/index.js')
const packageDirDist = `${currentPackageDir}/dist`
// import { name, version } from './package.json' assert { type: 'json' }

const config = {
  input,
  external: [],
  output: {
    file: `${packageDirDist}/index.esm.js`,
    format: 'es',
    sourcemap: true,
    exports: 'named',
    ...getBasicOutput({ name: '1', version: '' }),
    // ...getBasicOutput({ name, version }),
  },
  plugins: getBasicPlugins(),
}

export default config
