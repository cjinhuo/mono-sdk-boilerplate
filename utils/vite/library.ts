import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const packagesRoot = fileURLToPath(new URL('../../packages/', import.meta.url))

export const workspaceAliases = Object.fromEntries(
	['shared', 'core', 'web', 'react'].map((name) => [`@mono/${name}`, resolve(packagesRoot, name, 'src/index.ts')])
)

export function createLibraryConfig(directory: string) {
	const { name, version } = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'))
	return defineConfig({
		resolve: { alias: workspaceAliases },
		build: {
			target: 'es2015',
			minify: false,
			sourcemap: true,
			lib: {
				entry: resolve(directory, 'src/index.ts'),
				name: '_GLOBAL_',
				formats: ['es', 'cjs', 'iife'],
				fileName: (format) => (format === 'es' ? 'index.esm.js' : format === 'cjs' ? 'index.js' : 'index.min.js'),
			},
			rolldownOptions: {
				external: [],
				output: {
					exports: 'named',
					banner: `/* ${name} version:${version} */`,
					footer: '/* follow me on Github! @cjinhuo */',
				},
			},
		},
	})
}
