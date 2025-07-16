import type { ModCompWithPackage, NewChangesetWithCommit } from '@changesets/types'
import { formatGitCommitId, getGitRemoteUrl, getInfoByCommitId, splitSummary } from './helper'

/**
 * 获取变更集的 changelog
 * @param newChangesetWithCommit 变更集
 * @param isNestedFormat 是否使用嵌套格式，默认 false，为 true 时会添加前置空格，方便在 Updated By 下展示
 * @returns
 */
export async function getReleaseLine(
	newChangesetWithCommit: NewChangesetWithCommit,
	_bumpType: string,
	_option: unknown,
	isNestedFormat = false
) {
	if (!newChangesetWithCommit.commit) {
		throw new Error('CommitId Not Found From Changeset')
	}
	const { email, author, date, intactHash } = await getInfoByCommitId(newChangesetWithCommit.commit)
	const remoteUrl = await getGitRemoteUrl()
	const commitId = formatGitCommitId(newChangesetWithCommit.commit)
	const lines = splitSummary(newChangesetWithCommit.summary)

	const result: string[] = lines.map((line) => {
		return `${isNestedFormat ? '  ' : ''}- ${line} @${author || email} · ${date} · [#${commitId}](${remoteUrl}/commit/${intactHash})`
	})

	return result.join('\n')
}

export async function getDependencyReleaseLine(
	newChangesetWithCommits: NewChangesetWithCommit[],
	_dependenciesUpdated: ModCompWithPackage[]
) {
	if (!newChangesetWithCommits.length) return ''

	const releaseLines: string[] = []
	for (const changeset of newChangesetWithCommits) {
		const releaseLine = await getReleaseLine(changeset, '', '', true)
		releaseLines.push(releaseLine)
	}
	const dependenciesUpdated = _dependenciesUpdated[0]
	const updatedBy = `- Updated By ${dependenciesUpdated.name}: ${dependenciesUpdated.oldVersion}->${dependenciesUpdated.newVersion}`
	return `${updatedBy}\n${releaseLines.join('\n')}`
}
