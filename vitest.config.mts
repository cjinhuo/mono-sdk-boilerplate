import { defineConfig } from 'vitest/config'
import { workspaceAliases } from './utils/vite/library.ts'

export default defineConfig({
	resolve: { alias: workspaceAliases },
	test: {
		projects: [
			...['shared', 'core', 'web', 'react'].map((name) => ({
				extends: true,
				test: { name, environment: 'node', include: [`packages/${name}/src/**/*.spec.ts`] },
			})),
			{
				extends: true,
				test: { name: 'changesets', environment: 'node', include: ['utils/changesets/src/**/*.spec.ts'] },
			},
		],
		coverage: {
			provider: 'v8',
			include: ['packages/*/src/**/*.ts', 'utils/changesets/src/**/*.ts'],
			exclude: ['**/*.spec.ts'],
			reporter: ['text', 'html', 'lcov'],
		},
	},
})
