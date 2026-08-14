import { executePublish, parsePublishArgs } from './changeset_publish'

describe('changeset_publish', () => {
	it('publishes and pushes tags by default', async () => {
		const runCommand = jest.fn(async () => {})
		const pushTags = jest.fn(async () => {})

		await executePublish(parsePublishArgs([]), runCommand, pushTags)

		expect(runCommand).toHaveBeenCalledWith(['publish'])
		expect(pushTags).toHaveBeenCalledTimes(1)
	})

	it('forwards --no-git-tag and skips tag pushing', async () => {
		const runCommand = jest.fn(async () => {})
		const pushTags = jest.fn(async () => {})

		await executePublish(parsePublishArgs(['--no-git-tag']), runCommand, pushTags)

		expect(runCommand).toHaveBeenCalledWith(['publish', '--no-git-tag'])
		expect(pushTags).not.toHaveBeenCalled()
	})
})
