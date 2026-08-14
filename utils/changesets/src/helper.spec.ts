jest.mock('execa')

const execa = require('execa') as jest.Mock

import { gitPush } from './helper'

describe('gitPush', () => {
	beforeEach(() => {
		execa.mockReset()
	})

	it('reports a branch without an upstream', async () => {
		execa.mockResolvedValueOnce({ stdout: 'agent/test' })
		execa.mockRejectedValueOnce(new Error('no upstream'))

		await expect(gitPush()).rejects.toThrow('No upstream configured for branch agent/test')
	})

	it('uses the configured upstream and forwards follow-tags', async () => {
		execa
			.mockResolvedValueOnce({ stdout: 'agent/test' })
			.mockResolvedValueOnce({ stdout: 'origin/agent/test' })
			.mockResolvedValueOnce({ stdout: '' })

		await gitPush({ followTags: true })

		expect(execa).toHaveBeenNthCalledWith(
			2,
			'git',
			['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'],
			{ stdio: 'pipe' }
		)
		expect(execa).toHaveBeenNthCalledWith(3, 'git', ['push', '--follow-tags'], { stdio: 'inherit' })
	})
})
