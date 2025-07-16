import * as fs from 'node:fs'
import * as path from 'node:path'
import axios from 'axios'
import { createConsola } from 'consola'
import dayjs from 'dayjs'

const execa = require('execa')

import {
	COMMIT_TYPES,
	CommitType,
	CommitTypeTitle,
	CommitTypeZhTitle,
	MAX_GIT_COMMIT_ID_LENGTH,
	MAX_GIT_MESSAGE_LENGTH,
	REGULAR_COMMIT_TYPES,
	SUB_CHANGELOG_PREFIX,
} from './constants'

interface IEntry {
	/**
	 * 变更类型
	 */
	commitType: CommitType
	/**
	 * 变更摘要
	 */
	summary: string
	isEnglish: boolean
}

/**
 * 创建带有标签前缀的 consola 实例
 * @param tag 日志标签
 * @returns consola 实例
 */
function createLogger(tag: string = '') {
	const consola = createConsola({
		fancy: true,
		formatOptions: {
			date: true,
		},
	})
	return tag ? consola.withTag(tag) : consola
}

// 默认的 logger 实例
export const logger = createLogger('changeset')

/**
 * 返回拆分后的中英文内容，不符合格式时 throw error
 * @param changesetSummary changeset summary 内容
 * @returns
 */
export function splitSummary(changesetSummary: string) {
	const summaryLines = changesetSummary.split('\n').filter((line) => line.trim())
	if (summaryLines.length !== 2) {
		throw new Error('summary 有且仅包含一个 \\n 换行符')
	}
	// 按中英文分组
	let englishLine = ''
	let chineseLine = ''

	for (const line of summaryLines) {
		if (isContainsChinese(line)) {
			chineseLine = line
		} else {
			englishLine = line
		}
	}
	if (!englishLine) {
		throw new Error('summary 必须包含英文摘要')
	}
	if (!chineseLine) {
		throw new Error('summary 必须包含中文摘要')
	}

	return {
		englishLine,
		chineseLine,
	}
}

export function formatGitMessage(message: string) {
	if (message.length > MAX_GIT_MESSAGE_LENGTH) {
		return `${message.slice(0, MAX_GIT_MESSAGE_LENGTH - 4)}...`
	}
	return message
}

export function formatGitCommitId(commitId: string) {
	return commitId.slice(0, MAX_GIT_COMMIT_ID_LENGTH)
}

export async function getGitRemoteUrl() {
	try {
		const res = await execa('git', ['config', '--get', 'remote.origin.url'], { stdio: 'pipe' })
		let url = res.stdout.trim()
		// 转换SSH URL为HTTPS URL
		if (url.startsWith('git@')) {
			url = url.replace(/^git@([^:]+):/, 'https://$1/')
		}
		// 移除.git后缀
		url = url.replace(/\.git$/, '')
		return url
	} catch (_error) {
		return 'https://github.com/unknown/repo' // 默认值
	}
}
/**
 * 获取 commitId 对应的 GitHub 用户名
 * @param email 用户邮箱
 * @param intactHash 完整的 commitId
 * @returns 邮箱对应的 GitHub 用户名，没有 token 时用邮箱兜底
 */
async function getAuthorInfo(email: string, intactHash: string): Promise<string> {
	try {
		const token = process.env.CHANGESET_READ_REPO_TOKEN
		if (!token) {
			throw new Error('CHANGESET_READ_REPO_TOKEN is undefined')
		}
		const remoteUrl = await getGitRemoteUrl()
		const repoMatch = remoteUrl.match(/github\.com\/([^/]+\/[^/]+)$/)
		if (!repoMatch) {
			throw new Error('Failed to get GitHub repo')
		}
		const repo = repoMatch[1]
		const githubAuthor = await getGithubAuthor(repo, intactHash, token)
		if (githubAuthor) {
			return githubAuthor
		}
	} catch (_error) {
		// logger.warn('Failed to get GitHub author, using email fallback:', (error as Error).message)
	}
	return email
}

export async function getInfoByCommitId(commitId: string) {
	const splitChar = '__'
	const res = await execa('git', ['show', `--pretty=%ae${splitChar}%cd${splitChar}%H`, commitId], { stdio: 'pipe' })
	const match = res.stdout.match(/^(.*?)\n/m)
	if (!match) {
		throw new Error(`commitId ${commitId} not found`)
	}
	const [email, date, intactHash] = match[1].split(splitChar)

	// 获取作者信息（GitHub作者或email兜底）
	const author = await getAuthorInfo(email, intactHash)

	return { email, author, date: dayjs(date).format('YYYY-MM-DD'), intactHash }
}

export async function getGithubAuthor(repo: string, commitId: string, token: string): Promise<string> {
	try {
		const res = await axios.get(`https://api.github.com/repos/${repo}/commits/${commitId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: token,
			},
		})
		return res.data?.author?.login || res.data?.commit?.author?.name || ''
	} catch (error) {
		logger.warn('Failed to fetch GitHub author:', error)
		return ''
	}
}

export function isContainsChinese(text: string): boolean {
	return /[\u4e00-\u9fff]/.test(text)
}

/**
 * 检测当前项目使用的包管理器
 */
export function detectPackageManager(): string {
	const rootDir = process.cwd()

	// 检查锁文件来确定包管理器
	if (fs.existsSync(path.join(rootDir, 'pnpm-lock.yaml'))) {
		return 'pnpm'
	}
	if (fs.existsSync(path.join(rootDir, 'yarn.lock'))) {
		return 'yarn'
	}
	if (fs.existsSync(path.join(rootDir, 'package-lock.json'))) {
		return 'npm'
	}
	// 默认使用 npx
	return 'npx'
}

/**
 * Git add, commit and push changes
 * @param commitMessage - The commit message to use
 */
export async function gitPush(): Promise<void> {
	try {
		await execa('git', ['push'], { stdio: 'inherit' })
	} catch (error) {
		logger.error('git push error', (error as Error).message)
	}
}

export async function gitAddAndCommit(commitMessage: string) {
	try {
		await execa('git', ['add', '.'], { stdio: 'inherit' })
		await execa('git', ['commit', '-m', commitMessage], { stdio: 'inherit' })
	} catch (error) {
		logger.error('there is nothing to commit', (error as Error).message)
	}
}

/**
 * 获取上一个 commit 中变更的所有 CHANGELOG.md 文件路径
 * @returns 变更的 CHANGELOG.md 文件路径数组
 */
export async function getChangedChangelogFiles(): Promise<string[]> {
	try {
		// 获取上一个 commit 中变更的文件
		const res = await execa('git', ['diff', '--name-only', 'HEAD~1', 'HEAD'], { stdio: 'pipe' })
		const changedFiles = res.stdout.split('\n').filter((file) => file.trim())

		// 筛选出 CHANGELOG.md 文件
		const changelogFiles = changedFiles.filter(
			(file) => file.endsWith('CHANGELOG.md') && !file.includes('node_modules')
		)

		logger.info('Found changed CHANGELOG.md files:', changelogFiles)
		return changelogFiles
	} catch (error) {
		logger.warn('Failed to get changed changelog files:', (error as Error).message)
		return []
	}
}
/**
 * 获取指定文件在当前 commit 中的新增内容
 * @param filePath 文件路径
 * @returns 新增的内容行数组
 */
export async function getFileAddedContent(filePath: string): Promise<string> {
	try {
		// 获取文件的 diff，只显示新增的行
		const res = await execa('git', ['diff', 'HEAD~1', 'HEAD', filePath], {
			stdio: 'pipe',
			reject: false, // git diff 在有差异时会返回非零退出码，这是正常的
		})

		const diffLines = res.stdout.split('\n')
		const addedLines: string[] = []

		// 解析 diff 输出，提取以 '+' 开头的行（新增内容）
		for (const line of diffLines) {
			if (line.startsWith('+') && !line.startsWith('+++')) {
				// 移除开头的 '+' 符号
				addedLines.push(line.substring(1))
			}
		}

		logger.info(`Found ${addedLines.length} added lines in ${filePath}`)
		return addedLines.join('\n')
	} catch (error) {
		logger.warn(`Failed to get added content for ${filePath}:`, (error as Error).message)
		return ''
	}
}

/**
 * 解析 CHANGELOG.md 中的变更条目
 * @param content CHANGELOG.md 内容
 * @returns 解析后的变更条目数组
 */
export function parseChangelogEntries(content: string): Array<IEntry> {
	const entries: Array<IEntry> = []
	const lines = content.split('\n')
	for (const line of lines) {
		// 如果遇到子变更集前缀，直接返回已解析的条目，无需解析
		if (!line.trim()) continue
		if (line.trim().startsWith(SUB_CHANGELOG_PREFIX)) {
			return entries
		}
		const { commitType, summary } = getCommitTypeBySummary(line)
		const isEnglish = !isContainsChinese(line)
		entries.push({ commitType, summary, isEnglish })
	}
	return entries
}

function getCommitTypeBySummary(lintSummary: string) {
	// 格式是 - {type}: summary
	const content = lintSummary.trim().slice(2).trim()
	const summary = content.match(/:\s*(.+)/)?.[1] || ''
	for (const type of REGULAR_COMMIT_TYPES) {
		if (content.startsWith(type)) {
			return { commitType: type, summary }
		}
	}
	// 通过正则获取第一个 : 后的值
	return { commitType: CommitType.Other, summary }
}

/**
 * 按类型和语言分组变更条目
 * @param entries 变更条目数组
 * @returns 分组后的变更条目
 */
export function groupChangelogEntries(entries: Array<IEntry>) {
	const groups = {
		english: {
			[CommitType.Features]: [] as string[],
			[CommitType.BugFix]: [] as string[],
			[CommitType.Performance]: [] as string[],
			[CommitType.Doc]: [] as string[],
			[CommitType.Build]: [] as string[],
			[CommitType.Other]: [] as string[],
		},
		chinese: {
			[CommitType.Features]: [] as string[],
			[CommitType.BugFix]: [] as string[],
			[CommitType.Performance]: [] as string[],
			[CommitType.Doc]: [] as string[],
			[CommitType.Build]: [] as string[],
			[CommitType.Other]: [] as string[],
		},
	}

	for (const entry of entries) {
		const lang = entry.isEnglish ? 'english' : 'chinese'
		groups[lang][entry.commitType].push(entry.summary)
	}

	return groups
}

/**
 * 生成指定语言的变更条目内容
 * @param groups 分组后的变更条目
 * @param language 语言类型 ('english' | 'chinese')
 * @param titleMap 标题映射表
 * @returns 格式化后的内容字符串
 */
function generateLanguageSection(
	groups: ReturnType<typeof groupChangelogEntries>,
	language: 'english' | 'chinese',
	titleMap: Record<CommitType, string>
): string {
	let content = ''

	for (const type of COMMIT_TYPES) {
		if (groups[language][type].length > 0) {
			content += `#### ${titleMap[type]}\n`
			for (const entry of groups[language][type]) {
				content += `- ${entry}\n`
			}
			content += '\n'
		}
	}

	return content
}

/**
 * 生成结构化的 CHANGELOG.md 内容
 * @param version 版本号
 * @param changeType 变更类型 (Patch Changes, Minor Changes, Major Changes)
 * @param groups 分组后的变更条目
 * @returns 格式化后的 CHANGELOG.md 内容
 */
export function generateStructuredChangelog(
	version: string,
	changeType: string,
	groups: ReturnType<typeof groupChangelogEntries>
): string {
	let content = `## ${version}\n\n### ${changeType}\n\n`

	// 英文部分
	content += generateLanguageSection(groups, 'english', CommitTypeTitle)
	// 中文部分
	content += generateLanguageSection(groups, 'chinese', CommitTypeZhTitle)

	return content
}
