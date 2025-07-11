import type { ModCompWithPackage, NewChangesetWithCommit } from '@changesets/types'
import { CommitType, CommitTypeTitle, CommitTypeZhTitle } from './constants'
import { formatGitCommitId, getGitRemoteUrl, getInfoByCommitId } from './helper'

// 检测文本是否包含中文字符
function containsChinese(text: string): boolean {
	return /[\u4e00-\u9fff]/.test(text)
}

// 解析commit类型
function parseCommitType(summary: string): CommitType | null {
	const match = summary.match(/^(\w+):/)
	if (!match) return null

	const type = match[1] as CommitType
	return Object.values(CommitType).includes(type) ? type : CommitType.Other
}

export async function getReleaseLine(newChangesetWithCommit: NewChangesetWithCommit) {
	if (!newChangesetWithCommit.commit) {
		throw new Error('CommitId Not Found From Changeset')
	}
	const { email, date, intactHash } = await getInfoByCommitId(newChangesetWithCommit.commit)
	const remoteUrl = await getGitRemoteUrl()
	const commitId = formatGitCommitId(newChangesetWithCommit.commit)

	// 分割summary为多行
	const summaryLines = newChangesetWithCommit.summary.split('\n').filter((line) => line.trim())

	// 按中英文分组
	const englishLines: string[] = []
	const chineseLines: string[] = []

	for (const line of summaryLines) {
		if (containsChinese(line)) {
			chineseLines.push(line)
		} else {
			englishLines.push(line)
		}
	}

	const result: string[] = []

	// 处理英文内容
	if (englishLines.length > 0) {
		const groupedByType: Record<string, string[]> = {}

		for (const line of englishLines) {
			const commitType = parseCommitType(line) || CommitType.Other
			const title = CommitTypeTitle[commitType]

			if (!groupedByType[title]) {
				groupedByType[title] = []
			}
			groupedByType[title].push(line)
		}

		for (const [title, lines] of Object.entries(groupedByType)) {
			result.push(title)
			for (const line of lines) {
				result.push(`${line} @${email} · ${date} · [#${commitId}](${remoteUrl}/commit/${intactHash})`)
			}
		}
	}

	// 处理中文内容
	if (chineseLines.length > 0) {
		const groupedByType: Record<string, string[]> = {}

		for (const line of chineseLines) {
			const commitType = parseCommitType(line) || CommitType.Other
			const title = CommitTypeZhTitle[commitType]

			if (!groupedByType[title]) {
				groupedByType[title] = []
			}
			groupedByType[title].push(line)
		}

		for (const [title, lines] of Object.entries(groupedByType)) {
			result.push(title)
			for (const line of lines) {
				result.push(`${line} @${email} · ${date} · [#${commitId}](${remoteUrl}/commit/${intactHash})`)
			}
		}
	}

	return result.join('\n')
}

export async function getDependencyReleaseLine(
	newChangesetWithCommits: NewChangesetWithCommit[],
	_dependenciesUpdated: ModCompWithPackage[]
) {
	if (!newChangesetWithCommits.length) return ''

	const releaseLines: string[] = []
	for (const changeset of newChangesetWithCommits) {
		const releaseLine = await getReleaseLine(changeset)
		releaseLines.push(releaseLine)
	}
	const dependenciesUpdated = _dependenciesUpdated[0]
	const updatedBy = `- Updated By ${dependenciesUpdated.name}: ${dependenciesUpdated.oldVersion}->${dependenciesUpdated.newVersion}`
	return `${updatedBy}\n${releaseLines.map((v) => `  ${v}`).join('\n')}`
}
