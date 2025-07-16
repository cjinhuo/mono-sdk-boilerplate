#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as fg from 'fast-glob'
import * as micromatch from 'micromatch'

// minimist 仅支持 require
const minimist = require('minimist')
const execa = require('execa')

import { gitPush, logger } from '../helper'

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
const isPush = argv['git-push'] === true

/**
 * Delete pre.json file if it exists
 */
async function deletePreJsonIfExists(): Promise<void> {
	if (fs.existsSync(rootChangesetPre)) {
		await execa('rm', ['.changeset/pre.json'], { stdio: 'inherit' })
		logger.info('deleted pre.json')
	}
}

/**
 * Bump version for beta release
 * @param fn - Function to run after changeset version
 */
async function bumpVersionForBeta(fn: RestoreFunction): Promise<void> {
	logger.info('start bumping beta version...')
	// if already has entered pre mode, delete and re-enter
	await deletePreJsonIfExists()
	await execa('npx', ['changeset', 'pre', 'enter', BETA_PREFIX], { stdio: 'inherit' })
	await execa('npx', ['changeset', 'version'], { stdio: 'inherit' })
	fn()
	isPush && (await gitPush())
	logger.success('bump version successfully')
}

/**
 * Bump version for release
 * @param fn - Function to run after changeset version
 */
async function bumpVersionForRelease(fn: RestoreFunction): Promise<void> {
	logger.info('start bumping release version...')
	// 删除 pre.json 后，在 bump version for release 时会将所有的 beta 都转成 release
	await deletePreJsonIfExists()
	await execa('npx', ['changeset', 'version'], { stdio: 'inherit' })
	fn()
	// git add && push
	isPush && (await gitPush())
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
	const bumpVersionFn = argv.beta ? bumpVersionForBeta.bind(null, restore) : bumpVersionForRelease.bind(null, restore)
	await bumpVersionFn()
}

main().catch((error: Error) => {
	logger.error('Failed to execute:', error)
	process.exit(1)
})
