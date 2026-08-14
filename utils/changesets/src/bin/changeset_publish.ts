#!/usr/bin/env node

const execa = require('execa')

import { gitPush, logger } from '../helper'

export interface PublishArgs {
	gitTag: boolean
}

export type PublishCommandRunner = (args: string[]) => Promise<void>

const defaultCommandRunner: PublishCommandRunner = async (args) => {
	await execa('changeset', args, { stdio: 'inherit' })
}

export function parsePublishArgs(rawArgs: string[]): PublishArgs {
	return { gitTag: !rawArgs.includes('--no-git-tag') }
}

export async function executePublish(
	args: PublishArgs,
	runCommand: PublishCommandRunner = defaultCommandRunner,
	pushTags: () => Promise<void> = () => gitPush({ followTags: true })
): Promise<void> {
	logger.info('start publishing...')
	await runCommand(['publish', ...(args.gitTag ? [] : ['--no-git-tag'])])
	if (args.gitTag) await pushTags()
	logger.success('publish successfully')
}

async function main(): Promise<void> {
	await executePublish(parsePublishArgs(process.argv.slice(2)))
}

if (require.main === module) {
	main().catch((error: Error) => {
		logger.error('Failed to publish:', error)
		process.exitCode = 1
	})
}
