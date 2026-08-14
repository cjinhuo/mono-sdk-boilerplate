import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {
	bumpVersion,
	executeVersion,
	getChangesetPackages,
	hideUnmatchedChangesets,
	parseVersionArgs,
	restoreFilteredChangesets,
} from './changeset_version'

function createRoot(): string {
	const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'changesets-toolkit-'))
	fs.mkdirSync(path.join(rootDir, '.changeset'))
	return rootDir
}

function writeChangeset(rootDir: string, filename: string, packages: string[]): void {
	const releases = packages.map((name) => '"' + name + '": patch').join('\n')
	fs.writeFileSync(path.join(rootDir, '.changeset', filename), '---\n' + releases + '\n---\n\nsummary\n')
}

describe('changeset_version', () => {
	const roots: string[] = []

	afterEach(() => {
		for (const rootDir of roots.splice(0)) fs.rmSync(rootDir, { recursive: true, force: true })
	})

	it('rejects conflicting push arguments', () => {
		expect(() => parseVersionArgs(['--git-push', '--no-git-push'])).toThrow(
			'Cannot use --git-push and --no-git-push together'
		)
	})

	it('enters beta mode only on the first prerelease', async () => {
		const rootDir = createRoot()
		roots.push(rootDir)
		const runCommand = jest.fn(async () => {})

		await bumpVersion(rootDir, true, runCommand)
		expect(runCommand.mock.calls).toEqual([
			['changeset', ['pre', 'enter', 'beta']],
			['changeset', ['version']],
		])

		fs.writeFileSync(path.join(rootDir, '.changeset', 'pre.json'), JSON.stringify({ mode: 'pre', tag: 'beta' }))
		runCommand.mockClear()
		await bumpVersion(rootDir, true, runCommand)
		expect(runCommand).toHaveBeenCalledTimes(1)
		expect(runCommand).toHaveBeenCalledWith('changeset', ['version'])
	})

	it('exits prerelease mode before a stable version', async () => {
		const rootDir = createRoot()
		roots.push(rootDir)
		fs.writeFileSync(path.join(rootDir, '.changeset', 'pre.json'), JSON.stringify({ mode: 'pre', tag: 'beta' }))
		const runCommand = jest.fn(async () => {})

		await bumpVersion(rootDir, false, runCommand)
		expect(runCommand.mock.calls).toEqual([
			['changeset', ['pre', 'exit']],
			['changeset', ['version']],
		])
	})

	it('keeps a multi-package changeset whole when filtering', () => {
		const rootDir = createRoot()
		roots.push(rootDir)
		writeChangeset(rootDir, 'multi.md', ['@mono/core', '@mono/shared'])
		writeChangeset(rootDir, 'other.md', ['@mono/web'])

		const multiPath = path.join(rootDir, '.changeset', 'multi.md')
		expect(getChangesetPackages(multiPath)).toEqual(['@mono/core', '@mono/shared'])

		const restore = hideUnmatchedChangesets(rootDir, '@mono/core')
		expect(fs.existsSync(multiPath)).toBe(true)
		expect(fs.existsSync(path.join(rootDir, '.changeset', 'other.md'))).toBe(false)
		restore()
		expect(fs.existsSync(path.join(rootDir, '.changeset', 'other.md'))).toBe(true)
	})

	it('reports a filter with no matching changeset', () => {
		const rootDir = createRoot()
		roots.push(rootDir)
		writeChangeset(rootDir, 'core.md', ['@mono/core'])

		expect(() => hideUnmatchedChangesets(rootDir, '@mono/web')).toThrow(
			'No pending changesets match --filter @mono/web'
		)
	})

	it('restores hidden changesets when versioning fails', async () => {
		const rootDir = createRoot()
		roots.push(rootDir)
		writeChangeset(rootDir, 'core.md', ['@mono/core'])
		writeChangeset(rootDir, 'web.md', ['@mono/web'])

		const runCommand = jest.fn(async () => {
			throw new Error('version failed')
		})

		await expect(
			executeVersion({ beta: false, filter: '@mono/core', gitPush: false }, rootDir, runCommand)
		).rejects.toThrow('version failed')
		expect(fs.existsSync(path.join(rootDir, '.changeset', 'web.md'))).toBe(true)
		expect(fs.existsSync(path.join(rootDir, '.changeset', '.filtered'))).toBe(false)
	})

	it('recovers changesets left behind by an interrupted run', () => {
		const rootDir = createRoot()
		roots.push(rootDir)
		const filteredDir = path.join(rootDir, '.changeset', '.filtered')
		fs.mkdirSync(filteredDir)
		writeChangeset(rootDir, 'core.md', ['@mono/core'])
		fs.renameSync(path.join(rootDir, '.changeset', 'core.md'), path.join(filteredDir, 'core.md'))

		restoreFilteredChangesets(rootDir)
		expect(fs.existsSync(path.join(rootDir, '.changeset', 'core.md'))).toBe(true)
		expect(fs.existsSync(filteredDir)).toBe(false)
	})

	it('pushes only after successful versioning', async () => {
		const rootDir = createRoot()
		roots.push(rootDir)
		const events: string[] = []

		await executeVersion(
			{ beta: false, gitPush: true },
			rootDir,
			async () => {
				events.push('version')
			},
			async () => {
				events.push('push')
			}
		)

		expect(events).toEqual(['version', 'push'])
	})
})
