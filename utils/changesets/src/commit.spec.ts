import { getAddMessage, getVersionMessage } from './commit'

describe('commit hooks', () => {
	it('creates a non-empty add commit for the Changesets 3 payload', async () => {
		const message = await (getAddMessage as any)(
			{
				id: 'brave-butterflies-upgrade',
				summary: 'Upgrade Changesets',
				releases: [
					{ name: 'changesets-toolkit', type: 'minor' },
					{ name: '@mono/core', type: 'patch' },
				],
			},
			{}
		)

		expect(message).toBe('chore(changeset): 🦋 changesets-toolkit:minor,@mono/core:patch')
	})

	it('creates a version commit message', async () => {
		const message = await (getVersionMessage as any)(
			{
				changesets: [],
				releases: [
					{
						name: 'changesets-toolkit',
						type: 'minor',
						oldVersion: '0.0.4',
						newVersion: '0.1.0',
						changesets: ['brave-butterflies-upgrade'],
					},
				],
			},
			{}
		)

		expect(message).toBe('chore(changeset): 🦋 changesets-toolkit:0.0.4->0.1.0')
	})
})
