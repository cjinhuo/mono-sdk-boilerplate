#!/usr/bin/env node

// minimist 仅支持 require
const minimist = require('minimist')
const execa = require('execa')

import { logger } from '../helper'

interface Args {
	'git-tag'?: boolean
}

const argv: Args = minimist(process.argv.slice(2))

async function main(): Promise<void> {
	logger.info('start publishing...')

	if (argv['git-tag'] === false) {
		await execa('npx', ['changeset', 'publish', '--no-git-tag'], { stdio: 'inherit' })
	} else {
		await execa('npx', ['changeset', 'publish'], { stdio: 'inherit' })
		// 获取当前分支名
		const { stdout: currentBranch } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
		logger.info(`git push --follow-tags origin ${currentBranch}...`)
		await execa('git', ['push', '--follow-tags', 'origin', currentBranch], { stdio: 'inherit' })
	}

	logger.info('publish successfully')
}

main().catch((error: Error) => {
	logger.error('Failed to publish:', error)
	process.exit(1)
})
