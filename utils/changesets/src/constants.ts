export const MAX_GIT_MESSAGE_LENGTH = 120
export const MAX_GIT_COMMIT_ID_LENGTH = 8
export const ChangesTitle = `What's Changed`
export const ChangesZhTitle = '更新内容'
export enum CommitType {
	Performance = 'perf',
	Features = 'feat',
	BugFix = 'fix',
	Doc = 'doc',
	Build = 'build',
	Other = 'other',
}
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
