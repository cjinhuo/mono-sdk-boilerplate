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

export async function getInfoByCommitId(commitId) {
	const splitChar = '__'
	const res = await execa('git', ['show', `--pretty=%ae${splitChar}%cd${splitChar}%H`, commitId], { stdio: 'pipe' })
	const match = res.stdout.match(/^(.*?)\n/m)
	if (!match) {
		throw new Error(`commitId ${commitId} not found`)
	}
	console.log(match[1])
	const [email, date, intactHash] = match[1].split(splitChar)
	return { email, date: dayjs(date).format('YYYY-MM-DD'), intactHash }
}
