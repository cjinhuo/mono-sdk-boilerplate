import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, before, test } from 'node:test'
import vm from 'node:vm'

const root = resolve(import.meta.dirname, '..')
const fixture = mkdtempSync(join(tmpdir(), 'mono-package-consumers-'))
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const pnpm = process.env.npm_execpath ?? (process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm')
const contracts = {
	shared: {
		keys: ['isString'],
		expression: '[p.isString("text"), p.isString(0), p.isString(null)]',
		result: [true, false, false],
	},
	core: {
		keys: ['CoreConstant', 'coreAdd', 'coreIsString'],
		expression: '[p.coreAdd(1, 2), p.coreAdd(-2, 0), p.coreIsString("text"), p.coreIsString({}), p.CoreConstant]',
		result: [3, -2, true, false, 'Constant'],
	},
	web: {
		keys: ['webAdd', 'webIsString'],
		expression: '[p.webAdd(1, 2), p.webIsString("text"), p.webIsString(undefined)]',
		result: [3, true, false],
	},
	react: {
		keys: ['reactAdd'],
		expression: '[p.reactAdd(1, 2), p.reactAdd(0, 0), p.reactAdd(-1, 2)]',
		result: [6, 2, 2],
	},
}

function run(command, args, cwd = fixture) {
	return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

before(() => {
	const dependencies = {}
	for (const directory of ['packages/shared', 'packages/core', 'packages/web', 'packages/react', 'utils/changesets']) {
		const manifest = JSON.parse(readFileSync(join(root, directory, 'package.json'), 'utf8'))
		run(pnpm, ['pack', '--pack-destination', fixture], join(root, directory))
		dependencies[manifest.name] =
			`file:${join(fixture, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`
	}
	writeFileSync(
		join(fixture, 'package.json'),
		JSON.stringify({ name: 'package-consumer-fixture', version: '1.0.0', private: true, dependencies })
	)
	run(npm, ['install', '--ignore-scripts', '--no-audit', '--no-fund'])
	mkdirSync(join(fixture, '.changeset'))
	writeFileSync(
		join(fixture, '.changeset/config.json'),
		JSON.stringify({
			changelog: false,
			commit: false,
			access: 'public',
			baseBranch: 'master',
			updateInternalDependencies: 'patch',
			fixed: [],
			linked: [],
			ignore: [],
		})
	)
})

after(() => rmSync(fixture, { recursive: true, force: true }))

for (const [name, contract] of Object.entries(contracts)) {
	for (const format of ['require', 'import']) {
		test(`packed @mono/${name} preserves its ${format} API`, () => {
			const load = format === 'require' ? `const p = require('@mono/${name}')` : `import * as p from '@mono/${name}'`
			const output = run(process.execPath, [
				'--input-type',
				format === 'require' ? 'commonjs' : 'module',
				'-e',
				`${load}; console.log(JSON.stringify({keys: Object.keys(p).sort(), result: ${contract.expression}}))`,
			])
			assert.deepEqual(JSON.parse(output), { keys: contract.keys, result: contract.result })
		})
	}
	test(`packed @mono/${name} preserves the legacy ESM subpath`, () => {
		const output = run(process.execPath, [
			'--input-type',
			'module',
			'-e',
			`import * as p from '@mono/${name}/dist/index.esm.js'; console.log(JSON.stringify(${contract.expression}))`,
		])
		assert.deepEqual(JSON.parse(output), contract.result)
	})
	test(`packed @mono/${name} exposes a clean browser IIFE`, () => {
		const code = readFileSync(join(fixture, 'node_modules', '@mono', name, 'dist/index.min.js'), 'utf8')
		const sandbox = vm.createContext({})
		vm.runInContext(code, sandbox)
		assert.deepEqual(Object.keys(sandbox._GLOBAL_).sort(), contract.keys)
		assert.deepEqual(
			JSON.parse(vm.runInContext(`JSON.stringify((p => ${contract.expression})(_GLOBAL_))`, sandbox)),
			contract.result
		)
		assert.equal(sandbox.__coverage__, undefined, 'release artifacts must not install coverage instrumentation')
	})
}

test('packed declarations support bundler, native ESM, and CommonJS consumers', () => {
	const source = `import { isString } from '@mono/shared'
import { coreAdd, coreIsString, CoreConstant } from '@mono/core'
import { webAdd, webIsString } from '@mono/web'
import { reactAdd } from '@mono/react'
const sum: number = coreAdd(1, 2) + webAdd(1, 2) + reactAdd(1, 2)
const checks: boolean[] = [isString(null), coreIsString('text'), webIsString(0)]
const constant: 'Constant' = CoreConstant
// @ts-expect-error SDK arithmetic accepts numbers only
coreAdd('1', 2)
void [sum, checks, constant]
`
	for (const extension of ['ts', 'mts', 'cts']) writeFileSync(join(fixture, `consumer.${extension}`), source)
	const tsc = join(root, 'node_modules/typescript/bin/tsc')
	for (const resolution of ['Bundler', 'NodeNext']) {
		writeFileSync(
			join(fixture, 'tsconfig.json'),
			JSON.stringify({
				compilerOptions: {
					strict: true,
					noEmit: true,
					skipLibCheck: false,
					target: 'ES2015',
					module: resolution === 'Bundler' ? 'ESNext' : 'NodeNext',
					moduleResolution: resolution,
					types: [],
				},
				include: ['consumer.ts', 'consumer.mts', 'consumer.cts'],
			})
		)
		run(process.execPath, [tsc, '-p', 'tsconfig.json'])
	}
})

test('packed Changesets hooks remain loadable through the documented CommonJS paths', () => {
	const output = run(process.execPath, [
		'-e',
		`const commit = require('changesets-toolkit/dist/commit.js'); const changelog = require('changesets-toolkit/dist/changelog.js'); commit.getAddMessage({releases:[{name:'example',type:'patch'}]},{}).then(message=>console.log(JSON.stringify({message, release:typeof changelog.getReleaseLine, dependency:typeof changelog.getDependencyReleaseLine})))`,
	])
	assert.deepEqual(JSON.parse(output), {
		message: 'chore(changeset): 🦋 example:patch',
		release: 'function',
		dependency: 'function',
	})
})

test('the installed version CLI remains executable and rejects conflicting push flags', () => {
	const bin = join(
		fixture,
		'node_modules/.bin',
		process.platform === 'win32' ? 'changeset_version.cmd' : 'changeset_version'
	)
	assert.throws(
		() => run(bin, ['--git-push', '--no-git-push']),
		(error) => error.status === 1 && error.stderr.includes('Cannot use --git-push and --no-git-push together')
	)
})

test('the installed publish CLI handles an empty private workspace without publishing', () => {
	const bin = join(
		fixture,
		'node_modules/.bin',
		process.platform === 'win32' ? 'changeset_publish.cmd' : 'changeset_publish'
	)
	assert.match(run(bin, ['--no-git-tag']), /publish successfully/)
})
