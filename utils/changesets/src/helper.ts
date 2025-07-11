import axios from 'axios'
import dayjs from 'dayjs'
import { execa } from 'execa'
import { MAX_GIT_COMMIT_ID_LENGTH, MAX_GIT_MESSAGE_LENGTH } from './constants'

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
async function getAuthorInfo(email: string, intactHash: string): Promise<string> {
	try {
		const remoteUrl = await getGitRemoteUrl()
		const repoMatch = remoteUrl.match(/github\.com\/([^/]+\/[^/]+)$/)
		const token = process.env.GITHUB_CHANGESET_TOKEN
		if (repoMatch && token) {
			const repo = repoMatch[1]
			const githubAuthor = await getGithubAuthor(repo, intactHash, token)
			if (githubAuthor) {
				return githubAuthor
			}
		}
	} catch (error) {
		console.warn('Failed to get GitHub author, using email fallback:', error)
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
	console.log(match[1])
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
		console.warn('Failed to fetch GitHub author:', error)
		return ''
	}
}

export function isContainsChinese(text: string): boolean {
	return /[\u4e00-\u9fff]/.test(text)
}
