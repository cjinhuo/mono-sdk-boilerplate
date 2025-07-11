import type { ModCompWithPackage, NewChangesetWithCommit } from '@changesets/types'
import { formatGitCommitId, getGitRemoteUrl, getInfoByCommitId } from './helper'

export async function getReleaseLine(newChangesetWithCommit: NewChangesetWithCommit) {
	if (!newChangesetWithCommit.commit) {
		throw new Error('CommitId Not Found From Changeset')
	}
	const { email, date, intactHash } = await getInfoByCommitId(newChangesetWithCommit.commit)
	const remoteUrl = await getGitRemoteUrl()
	// - [c0b7864a4] @chenjinhuo - 2023.03.12:新增某某字段
	return `- [${formatGitCommitId(newChangesetWithCommit.commit)}](${remoteUrl}/commit/${intactHash}) @${email} - ${date} => ${newChangesetWithCommit.summary}`
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
