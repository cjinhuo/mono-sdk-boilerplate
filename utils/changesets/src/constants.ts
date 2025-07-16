export const MAX_GIT_MESSAGE_LENGTH = 120
export const MAX_GIT_COMMIT_ID_LENGTH = 8
export const SUB_CHANGELOG_PREFIX = '- Updated By'
export const ChangesTitle = `What's Changed`
export const ChangesZhTitle = '更新内容'
export enum CommitType {
	Performance = 'perf',
	Features = 'feat',
	BugFix = 'fix',
	Doc = 'doc',
	Build = 'build',
	// 不属于前面几个时都归类到 Other
	Other = 'other',
}
export const REGULAR_COMMIT_TYPES = [
	CommitType.Features,
	CommitType.BugFix,
	CommitType.Performance,
	CommitType.Doc,
	CommitType.Build,
]
export const COMMIT_TYPES = [...REGULAR_COMMIT_TYPES, CommitType.Other]
export const CommitTypeTitle = {
	[CommitType.Performance]: 'Performance Improvements ⚡',
	[CommitType.Features]: 'New Features 🎉',
	[CommitType.BugFix]: 'Bug Fixes 🐞',
	[CommitType.Doc]: 'Docs update 📄',
	[CommitType.Build]: 'Build System update 📦️',
	[CommitType.Other]: 'Other Changes',
}

export const CommitTypeZhTitle = {
	[CommitType.Performance]: '性能优化 ⚡',
	[CommitType.Features]: '新特性 🎉',
	[CommitType.BugFix]: 'Bug 修复 🐞',
	[CommitType.Doc]: '文档更新 📄',
	[CommitType.Build]: '构建系统更新 📦️',
	[CommitType.Other]: '其他变更',
}
