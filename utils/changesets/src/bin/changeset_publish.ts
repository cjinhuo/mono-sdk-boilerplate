#!/usr/bin/env node

// minimist 仅支持 require
const minimist = require('minimist')
const execa = require('execa')

import { detectPackageManager, logger } from '../helper'

interface Args {
	'git-tag'?: boolean
}

const argv: Args = minimist(process.argv.slice(2))

async function main(): Promise<void> {
	const packageManager = detectPackageManager()
	logger.info(`start publishing with ${packageManager}...`)

	if (argv['git-tag'] === false) {
		await execa(packageManager, ['changeset', 'publish', '--no-git-tag'], { stdio: 'inherit' })
	} else {
		await execa(packageManager, ['changeset', 'publish'], { stdio: 'inherit' })
		logger.info('git push --follow-tags...')
		await execa('git', ['push', '--follow-tags'], { stdio: 'inherit' })
	}

	logger.info('publish successfully')
}

main().catch((error: Error) => {
	logger.error('Failed to publish:', error)
	process.exit(1)
})
