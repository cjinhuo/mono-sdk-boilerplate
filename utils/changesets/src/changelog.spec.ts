jest.mock('./helper', () => ({
	formatGitCommitId: jest.fn(() => 'abcdef1'),
	getGitRemoteUrl: jest.fn(async () => 'https://github.com/example/repo'),
	getInfoByCommitId: jest.fn(async () => ({
		email: 'author@example.com',
		author: 'author',
		date: '2026-08-14',
		intactHash: 'abcdef1234567890',
	})),
	splitSummary: jest.fn((summary: string) => summary.split('\n').filter(Boolean)),
}))

import { getDependencyReleaseLine, getReleaseLine } from './changelog'

const changeset = {
	id: 'brave-butterflies-upgrade',
	commit: 'abcdef1234567890',
	summary: 'feat: first line\nfix: second line',
	releases: [{ name: 'changesets-toolkit', type: 'minor' }],
} as any

describe('changelog hooks', () => {
	it('formats release lines', async () => {
		await expect(getReleaseLine(changeset, 'minor', {})).resolves.toBe(
			[
				'- feat: first line @author · 2026-08-14 · [#abcdef1](https://github.com/example/repo/commit/abcdef1234567890)',
				'- fix: second line @author · 2026-08-14 · [#abcdef1](https://github.com/example/repo/commit/abcdef1234567890)',
			].join('\n')
		)
	})

	it('formats nested dependency release lines', async () => {
		const result = await getDependencyReleaseLine(
			[changeset],
			[{ name: '@mono/core', oldVersion: '1.0.0', newVersion: '1.0.1' }] as any
		)

		expect(result).toContain('- Updated By @mono/core: 1.0.0->1.0.1')
		expect(result).toContain('  - feat: first line @author')
	})
})
