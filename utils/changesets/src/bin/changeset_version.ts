#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as fg from 'fast-glob'
import * as micromatch from 'micromatch'

const minimist = require('minimist')
const execa = require('execa')

import { gitPush, logger } from '../helper'

const BETA_TAG = 'beta'
const FILTERED_DIR_NAME = '.filtered'

export interface VersionArgs {
	beta: boolean
	filter?: string
	gitPush: boolean
}

export type CommandRunner = (command: string, args: string[]) => Promise<void>
export type PreStatePersister = (rootDir: string) => Promise<void>

type PreState = {
	mode: 'pre' | 'exit'
	tag: string
}

type RestoreFunction = () => void

const defaultCommandRunner: CommandRunner = async (command, args) => {
	await execa(command, args, { stdio: 'inherit' })
}

export const persistPrereleaseState: PreStatePersister = async (rootDir) => {
	const preJsonPath = path.join(rootDir, '.changeset', 'pre.json')
	if (!fs.existsSync(preJsonPath)) {
		throw new Error('Changesets did not create ' + preJsonPath)
	}

	await execa('git', ['add', '--', '.changeset/pre.json'], { cwd: rootDir, stdio: 'inherit' })
	await execa('git', ['commit', '-m', 'chore(changeset): enter beta prerelease'], {
		cwd: rootDir,
		stdio: 'inherit',
	})
}

export function parseVersionArgs(rawArgs: string[]): VersionArgs {
	const hasGitPush = rawArgs.includes('--git-push')
	const hasNoGitPush = rawArgs.includes('--no-git-push')
	if (hasGitPush && hasNoGitPush) {
		throw new Error('Cannot use --git-push and --no-git-push together')
	}

	const argv = minimist(rawArgs)
	if (argv.filter !== undefined && typeof argv.filter !== 'string') {
		throw new Error('--filter requires a glob pattern')
	}

	return {
		beta: argv.beta === true,
		filter: argv.filter,
		gitPush: hasGitPush,
	}
}

export function readPreState(rootDir: string): PreState | undefined {
	const preJsonPath = path.join(rootDir, '.changeset', 'pre.json')
	if (!fs.existsSync(preJsonPath)) return undefined

	const value = JSON.parse(fs.readFileSync(preJsonPath, 'utf8')) as Partial<PreState>
	if ((value.mode !== 'pre' && value.mode !== 'exit') || typeof value.tag !== 'string') {
		throw new Error('Invalid prerelease state in ' + preJsonPath)
	}
	return value as PreState
}

function getFilteredDir(rootDir: string): string {
	return path.join(rootDir, '.changeset', FILTERED_DIR_NAME)
}

export function restoreFilteredChangesets(rootDir: string): void {
	const filteredDir = getFilteredDir(rootDir)
	if (!fs.existsSync(filteredDir)) return

	for (const filename of fs.readdirSync(filteredDir)) {
		if (!filename.endsWith('.md')) continue
		const sourcePath = path.join(filteredDir, filename)
		const targetPath = path.join(rootDir, '.changeset', filename)
		if (fs.existsSync(targetPath)) {
			throw new Error('Cannot restore filtered changeset because ' + targetPath + ' already exists')
		}
		fs.renameSync(sourcePath, targetPath)
	}

	if (fs.readdirSync(filteredDir).length === 0) {
		fs.rmdirSync(filteredDir)
	}
}

export function getChangesetPackages(filePath: string): string[] {
	const content = fs.readFileSync(filePath, 'utf8')
	const frontmatter = /^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/.exec(content)?.[1]
	if (!frontmatter) return []

	return frontmatter
		.split('\n')
		.map((line) => /^\s*(["']?[^"':]+["']?)\s*:\s*(?:patch|minor|major)\s*$/.exec(line)?.[1])
		.filter((name): name is string => Boolean(name))
		.map((name) => name.replace(/^["']|["']$/g, ''))
}

export function hideUnmatchedChangesets(rootDir: string, filter: string): RestoreFunction {
	restoreFilteredChangesets(rootDir)

	const changesetDir = path.join(rootDir, '.changeset')
	const changesetPaths = fg
		.sync('*.md', { cwd: changesetDir, absolute: true, onlyFiles: true })
		.filter((filePath) => path.basename(filePath) !== 'README.md')

	const matchedPaths = changesetPaths.filter((filePath) => {
		const packageNames = getChangesetPackages(filePath)
		return packageNames.some((packageName) => micromatch.isMatch(packageName, filter))
	})

	if (matchedPaths.length === 0) {
		throw new Error('No pending changesets match --filter ' + filter)
	}

	const matchedSet = new Set(matchedPaths)
	const hiddenPaths = changesetPaths.filter((filePath) => !matchedSet.has(filePath))
	if (hiddenPaths.length === 0) return () => {}

	const filteredDir = getFilteredDir(rootDir)
	fs.mkdirSync(filteredDir, { recursive: true })
	const movedFiles: string[] = []

	const restore = (): void => {
		for (const filename of movedFiles.reverse()) {
			const sourcePath = path.join(filteredDir, filename)
			const targetPath = path.join(changesetDir, filename)
			if (fs.existsSync(sourcePath)) fs.renameSync(sourcePath, targetPath)
		}
		if (fs.existsSync(filteredDir) && fs.readdirSync(filteredDir).length === 0) {
			fs.rmdirSync(filteredDir)
		}
	}

	try {
		for (const filePath of hiddenPaths) {
			const filename = path.basename(filePath)
			fs.renameSync(filePath, path.join(filteredDir, filename))
			movedFiles.push(filename)
		}
	} catch (error) {
		restore()
		throw error
	}

	logger.info('temporarily filtered ' + hiddenPaths.length + ' changeset(s)')
	return restore
}

export async function bumpVersion(
	rootDir: string,
	beta: boolean,
	runCommand: CommandRunner = defaultCommandRunner,
	persistPreState: PreStatePersister = persistPrereleaseState
): Promise<void> {
	const preState = readPreState(rootDir)

	if (beta) {
		if (preState?.tag !== undefined && preState.tag !== BETA_TAG) {
			throw new Error('Already in prerelease mode with tag ' + preState.tag + '; expected ' + BETA_TAG)
		}
		if (preState?.mode === 'exit') {
			throw new Error('Prerelease exit is pending; finish the stable version before starting another beta')
		}
		if (!preState) {
			await runCommand('changeset', ['pre', 'enter', BETA_TAG])
			await persistPreState(rootDir)
		}
	} else if (preState?.mode === 'pre') {
		await runCommand('changeset', ['pre', 'exit'])
	}

	await runCommand('changeset', ['version'])
}

export async function executeVersion(
	args: VersionArgs,
	rootDir = process.cwd(),
	runCommand: CommandRunner = defaultCommandRunner,
	push: () => Promise<void> = gitPush
): Promise<void> {
	restoreFilteredChangesets(rootDir)
	const restore = args.filter ? hideUnmatchedChangesets(rootDir, args.filter) : () => {}

	try {
		await bumpVersion(rootDir, args.beta, runCommand)
	} finally {
		restore()
	}

	if (args.gitPush) await push()
	logger.success('bumped ' + (args.beta ? 'beta' : 'stable') + ' version successfully')
}

async function main(): Promise<void> {
	await executeVersion(parseVersionArgs(process.argv.slice(2)))
}

if (require.main === module) {
	main().catch((error: Error) => {
		logger.error('Failed to execute:', error)
		process.exitCode = 1
	})
}
