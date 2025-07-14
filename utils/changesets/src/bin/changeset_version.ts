#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as fg from 'fast-glob'
import * as micromatch from 'micromatch'

// minimist 仅支持 require
const minimist = require('minimist')
const execa = require('execa')

import { detectPackageManager, logger } from '../helper'

interface Args {
	beta?: boolean
	filter?: string
	'git-push'?: boolean
}

type RestoreFunction = () => void

const argv: Args = minimist(process.argv.slice(2))
const rootDir: string = process.cwd()
const rootChangesetPre: string = path.join(rootDir, '.changeset', 'pre.json')

const BETA_PREFIX = 'beta'

/**
 * Bump version for beta release
 * @param fn - Function to run after changeset version
 */
async function bumpVersionForBeta(fn: RestoreFunction): Promise<void> {
	const packageManager = detectPackageManager()
	logger.info('start bumping beta version...')
	// if already has entered pre mode, delete and re-enter
	if (fs.existsSync(rootChangesetPre)) {
		await execa('rm', ['.changeset/pre.json'], { stdio: 'inherit' })
		logger.info('deleted pre.json')
	}
	await execa(packageManager, ['changeset', 'pre', 'enter', BETA_PREFIX], { stdio: 'inherit' })
	await execa(packageManager, ['changeset', 'version'], { stdio: 'inherit' })
	fn()
	// git add && push
	await execa('git', ['add', '.'], { stdio: 'inherit' })
	await execa('git', ['commit', '-m', 'chore(changeset): 🦋 bump version for beta'], { stdio: 'inherit' })
	if (argv['git-push'] === undefined || argv['git-push'] === true) {
		await execa('git', ['push'], { stdio: 'inherit' })
	}
	logger.success('bump version successfully')
}

/**
 * Bump version for release
 * @param fn - Function to run after changeset version
 */
async function bumpVersionForRelease(fn: RestoreFunction): Promise<void> {
	logger.info('start bumping release version...')
	if (fs.existsSync(rootChangesetPre)) {
		// 删除 pre.json 后，在 bump version for release 时不会将所有的 beta 都转成 release
		await execa('rm', ['.changeset/pre.json'], { stdio: 'inherit' })
		logger.info('deleted pre.json')
	}
	await execa(detectPackageManager(), ['changeset', 'version'], { stdio: 'inherit' })
	fn()
	// git add && push
	try {
		await execa('git', ['add', '.'], { stdio: 'inherit' })
		await execa('git', ['commit', '-m', 'chore(changeset): 🦋 bump version for release'], { stdio: 'inherit' })
	} catch (error) {
		logger.info('there is nothing to commit', (error as Error).message)
	}

	if (argv['git-push'] === undefined || argv['git-push'] === true) {
		await execa('git', ['push'], { stdio: 'inherit' })
	}
	logger.success('bump version successfully')
}

function hiddenChangesets(): RestoreFunction {
	if (!argv.filter) return () => {}
	const mdRegex = /\s*---([\s\S]*?)\n\s*---(\s*(?:\n|$)[\s\S]*)/

	const changesetPaths = fg
		.sync(`${path.join(process.cwd(), '.changeset')}/*.md`, { onlyFiles: true })
		.filter((file) => !file.startsWith('.') && file.endsWith('.md') && !file.endsWith('README.md'))

	const needHiddenPaths: string[] = changesetPaths.reduce((acc: string[], filePath: string) => {
		const content: string = fs.readFileSync(filePath, { encoding: 'utf-8' })
		const match = mdRegex.exec(content)
		if (!match) return acc
		const [_, roughRelease] = match
		if (micromatch.contains(roughRelease, argv.filter)) {
			logger.info(`filePath:${filePath} is matched`)
			return acc
		}
		acc.push(filePath)
		return acc
	}, [])

	logger.info('needHiddenPaths', needHiddenPaths)
	// hardcode: 将无需 bump 的文件后缀名改为 mdx，changeset 就消费不到
	const mdxFiles: string[] = needHiddenPaths.map((filePath: string) => {
		const replaceFilePath: string = filePath.replace('.md', '.mdx')
		fs.renameSync(filePath, replaceFilePath)
		return replaceFilePath
	})
	return (): void => {
		mdxFiles.forEach((filePath: string) => fs.renameSync(filePath, filePath.replace('.mdx', '.md')))
	}
}

async function main(): Promise<void> {
	const restore: RestoreFunction = hiddenChangesets()
	if (argv.beta) {
		await bumpVersionForBeta(restore)
	} else {
		await bumpVersionForRelease(restore)
	}
}

main().catch((error: Error) => {
	logger.error('Failed to execute:', error)
	process.exit(1)
})
