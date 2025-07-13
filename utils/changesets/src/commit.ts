/**
 * Changeset Git Commit 消息生成器
 *
 * 该模块负责为 changeset 工作流生成标准化的 git commit 消息：
 * - 创建变更集时的提交消息
 * - 版本发布时的提交消息
 *
 * 所有生成的消息都会通过 formatGitMessage 进行长度限制处理
 */

import type { Changeset, ReleasePlan } from '@changesets/types'
import { formatGitMessage, splitSummary } from './helper'

/** Git commit message 前缀 */
const MESSAGE_PREFIX = `chore(changeset): 🦋`

/**
 * 生成 changeset 添加时的 git commit 消息
 *
 * 当开发者运行 `pnpm changeset` 创建变更集时，会自动生成并提交 git commit
 *
 * @param changeset - 变更集对象
 * @param changeset.confirmed - 是否已确认变更
 * @param changeset.summary - 变更摘要
 * @param changeset.releases - 发布信息数组
 * @param changeset.releases[].name - 包名
 * @param changeset.releases[].type - 变更类型 (patch|minor|major)
 *
 * @returns 格式化后的 git commit 消息，格式: `chore(changeset): 🦋 @package-name:patch`
 *
 * @example
 * ```typescript
 * const changeset = {
 *   confirmed: true,
 *   summary: 'Add new feature',
 *   releases: [{ name: '@mono/parser-view', type: 'patch' }]
 * }
 * // 返回: "chore(changeset): 🦋 @mono/parser-view:patch"
 * ```
 */
export async function getAddMessage(
	changeset: Changeset & {
		confirmed: boolean
	}
) {
	// 如果变更未确认，返回空字符串
	if (!changeset.confirmed) return ''
	// 检测是否符合格式
	splitSummary(changeset.summary)

	// 构建 git commit 消息
	const gitMessage = `${MESSAGE_PREFIX} ${changeset.releases.map((release) => `${release.name}:${release.type}`).join(',')}`

	// 格式化消息长度并返回
	return formatGitMessage(gitMessage)
}

/**
 * 生成版本发布时的 git commit 消息
 *
 * 当开发者运行 `pnpm changeset version` 更新版本时，会自动生成并提交 git commit
 *
 * @param releasePlan - 发布计划对象
 * @param releasePlan.changesets - 变更集数组
 * @param releasePlan.releases - 发布信息数组
 * @param releasePlan.releases[].name - 包名
 * @param releasePlan.releases[].type - 变更类型 (patch|minor|major)
 * @param releasePlan.releases[].oldVersion - 旧版本号
 * @param releasePlan.releases[].newVersion - 新版本号
 * @param releasePlan.releases[].changesets - 关联的变更集ID数组
 *
 * @returns 格式化后的 git commit 消息，格式: `chore(changeset): 🦋 @package-name:1.0.0->1.0.1`
 *
 * @example
 * ```typescript
 * const releasePlan = {
 *   changesets: [{
 *     releases: [{ name: '@mono/shared', type: 'minor' }],
 *     summary: 'Add new API',
 *     id: 'itchy-maps-compete'
 *   }],
 *   releases: [{
 *     name: '@mono/shared',
 *     type: 'minor',
 *     oldVersion: '1.1.0',
 *     changesets: ['itchy-maps-compete'],
 *     newVersion: '1.2.0'
 *   }]
 * }
 * 返回: "chore(changeset): 🦋 @mono/shared:1.1.0->1.2.0"
 * ```
 */
export async function getVersionMessage(releasePlan: ReleasePlan) {
	// 如果没有发布信息，返回空发布消息
	if (!Array.isArray(releasePlan.releases) || !releasePlan.releases.length) {
		return 'chore(changeset): empty release'
	}

	// 构建版本更新的 git commit 消息
	const gitMessage = `${MESSAGE_PREFIX} ${releasePlan.releases
		.map((release) => `${release.name}:${release.oldVersion}->${release.newVersion}`)
		.join(',')}`

	// 格式化消息长度并返回
	return formatGitMessage(gitMessage)
}
