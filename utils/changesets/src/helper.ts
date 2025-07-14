import * as fs from 'node:fs'
import * as path from 'node:path'
import axios from 'axios'
import { createConsola } from 'consola'
import dayjs from 'dayjs'

const execa = require('execa')

import { MAX_GIT_COMMIT_ID_LENGTH, MAX_GIT_MESSAGE_LENGTH } from './constants'

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
	const englishLines: string[] = []
	const chineseLines: string[] = []

	for (const line of summaryLines) {
		if (isContainsChinese(line)) {
			chineseLines.push(line)
		} else {
			englishLines.push(line)
		}
	}
	if (englishLines.length === 0) {
		throw new Error('summary 必须包含英文摘要')
	}
	if (chineseLines.length === 0) {
		throw new Error('summary 必须包含中文摘要')
	}

	return {
		englishLines,
		chineseLines,
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
	// 默认使用 npm
	return 'npx'
}
