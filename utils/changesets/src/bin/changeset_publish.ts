#!/usr/bin/env node

import consola from 'consola'
import { execa } from 'execa'
import minimist from 'minimist'
import { detectPackageManager } from 'src/helper'

interface Args {
	'git-tag'?: boolean
}

const argv: Args = minimist(process.argv.slice(2))

async function main(): Promise<void> {
	const packageManager = detectPackageManager()
	consola.info(`start publishing with ${packageManager}...`)

	if (argv['git-tag'] === false) {
		await execa(packageManager, ['changeset', 'publish', '--no-git-tag'], { stdio: 'inherit' })
	} else {
		await execa(packageManager, ['changeset', 'publish'], { stdio: 'inherit' })
		consola.info('git push --follow-tags...')
		await execa('git', ['push', '--follow-tags'], { stdio: 'inherit' })
	}

	consola.info('publish successfully')
}

main().catch((error: Error) => {
	consola.error('Failed to publish:', error)
	process.exit(1)
})
