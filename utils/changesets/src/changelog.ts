import type { ModCompWithPackage, NewChangesetWithCommit } from '@changesets/types'
import { CommitType, CommitTypeTitle, CommitTypeZhTitle } from './constants'
import { formatGitCommitId, getGitRemoteUrl, getInfoByCommitId, splitSummary } from './helper'

// 解析commit类型
function parseCommitType(summary: string): CommitType | null {
	const match = summary.match(/^(\w+):/)
	if (!match) return null

	const type = match[1] as CommitType
	return Object.values(CommitType).includes(type) ? type : CommitType.Other
}

/**
 * 获取变更集的 changelog
 * @param newChangesetWithCommit 变更集
 * @param isNestedFormat 是否使用嵌套格式，默认 false，为 true 时会添加前置空格，方便在 Updated By 下展示
 * @returns
 */
export async function getReleaseLine(newChangesetWithCommit: NewChangesetWithCommit, isNestedFormat = false) {
	if (!newChangesetWithCommit.commit) {
		throw new Error('CommitId Not Found From Changeset')
	}
	const { email, author, date, intactHash } = await getInfoByCommitId(newChangesetWithCommit.commit)
	const remoteUrl = await getGitRemoteUrl()
	const commitId = formatGitCommitId(newChangesetWithCommit.commit)

	const { englishLines, chineseLines } = splitSummary(newChangesetWithCommit.summary)

	const result: string[] = []

	// 处理提交信息的通用函数
	const processLines = (lines: string[], titleMap: Record<CommitType, string>) => {
		if (lines.length === 0) return

		const groupedByType = lines.reduce(
			(acc, line) => {
				const commitType = parseCommitType(line) || CommitType.Other
				const title = titleMap[commitType]

				if (!acc[title]) {
					acc[title] = []
				}
				acc[title].push(line)
				return acc
			},
			{} as Record<string, string[]>
		)

		Object.entries(groupedByType).forEach(([title, lines]) => {
			result.push(`${isNestedFormat ? title : `#### ${title}`}`)
			lines.forEach((line) => {
				result.push(
					`${isNestedFormat ? ' ' : ''}* ${line} @${author || email} · ${date} · [#${commitId}](${remoteUrl}/commit/${intactHash})`
				)
			})
		})
	}

	// 处理英文和中文内容
	processLines(englishLines, CommitTypeTitle)
	processLines(chineseLines, CommitTypeZhTitle)

	return result.join('\n')
}

export async function getDependencyReleaseLine(
	newChangesetWithCommits: NewChangesetWithCommit[],
	_dependenciesUpdated: ModCompWithPackage[]
) {
	if (!newChangesetWithCommits.length) return ''

	const releaseLines: string[] = []
	for (const changeset of newChangesetWithCommits) {
		const releaseLine = await getReleaseLine(changeset, true)
		releaseLines.push(releaseLine)
	}
	const dependenciesUpdated = _dependenciesUpdated[0]
	const updatedBy = `- Updated By ${dependenciesUpdated.name}: ${dependenciesUpdated.oldVersion}->${dependenciesUpdated.newVersion}`
	return `${updatedBy}\n${releaseLines.map((v) => `  ${v}`).join('\n')}`
}
