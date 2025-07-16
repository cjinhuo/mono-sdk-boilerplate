#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as fg from 'fast-glob'
import * as micromatch from 'micromatch'

// minimist 仅支持 require
const minimist = require('minimist')
const execa = require('execa')

import {
	generateStructuredChangelog,
	getChangedChangelogFiles,
	getFileAddedContent,
	gitPush,
	groupChangelogEntries,
	logger,
	parseChangelogEntries,
} from '../helper'

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

	// 处理所有变更的 CHANGELOG.md 文件的内容转换和类型合并
	await processAllChangedChangelogs()

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

/**
 * 处理所有变更的 CHANGELOG.md 文件的内容转换和类型合并
 * @returns 是否成功处理
 */
async function processAllChangedChangelogs() {
	try {
		const changedChangelogFiles = await getChangedChangelogFiles()
		if (changedChangelogFiles.length === 0) {
			logger.warn('No changed CHANGELOG.md files found')
			return false
		}
		// 处理每个变更的 CHANGELOG.md 文件
		for (const filePath of changedChangelogFiles) {
			const absolutePath = path.resolve(process.cwd(), filePath)
			if (!fs.existsSync(absolutePath)) {
				logger.warn(`File not found: ${absolutePath}`)
				continue
			}
			logger.info(`Processing changelog: ${filePath}`)

			// 获取当前 commit 中新增的内容
			const addedContent = await getFileAddedContent(filePath)
			if (!addedContent.trim()) {
				logger.warn(`No added content found for ${filePath}, skipping`)
				continue
			}

			// 判断如果新增的内容中包含- Updated By，说明是子变更集的内容，不需要处理

			// 解析新增内容中的版本信息
			const versionMatch = addedContent.match(/^## (.+)$/m)
			const changeTypeMatch = addedContent.match(/^### (.+)$/m)

			if (!versionMatch || !changeTypeMatch) {
				logger.warn(`Could not parse version or change type from added content in ${filePath}`)
				continue
			}

			const version = versionMatch[1]
			const changeType = changeTypeMatch[1]

			// 解析新增的变更条目
			const entries = parseChangelogEntries(addedContent)
			if (entries.length === 0) {
				logger.warn(`No changelog entries found in added content of ${filePath}`)
				continue
			}

			// 按类型和语言分组
			const groups = groupChangelogEntries(entries)

			// 生成结构化内容
			const structuredContent = generateStructuredChangelog(version, changeType, groups)

			// 读取当前完整文件内容
			const currentFullContent = fs.readFileSync(absolutePath, 'utf-8')

			if (!currentFullContent.includes(addedContent)) {
				logger.warn(`${filePath} 内容已被修改过，无法替换结构 Changelog`)
				continue
			}
			// 直接用结构化内容替换原始的新增内容
			const finalContent = currentFullContent.replace(addedContent, structuredContent)

			// 写入新的结构化内容
			fs.writeFileSync(absolutePath, finalContent, 'utf-8')
			logger.success(`Successfully processed ${filePath}`)
		}
	} catch (error) {
		logger.error('Failed to process changed changelogs:', (error as Error).message)
		return false
	}
}

async function main(): Promise<void> {
	await processAllChangedChangelogs()
	// const restore: RestoreFunction = hiddenChangesets()
	// const bumpVersionFn = argv.beta ? bumpVersionForBeta.bind(null, restore) : bumpVersionForRelease.bind(null, restore)
	// await bumpVersionFn()
}

main().catch((error: Error) => {
	logger.error('Failed to execute:', error)
	process.exit(1)
})
