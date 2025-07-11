#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const consola = require('consola')
const execa = require('execa')
const fg = require('fast-glob')
const micromatch = require('micromatch')
const minimist = require('minimist')

const argv = minimist(process.argv.slice(2))
const rootDir = process.cwd()
const rootChangesetPre = path.join(rootDir, '.changeset', 'pre.json')
/**
 *
 * @param {*} fn run after changeset version
 */
async function bumpVersionForAlpha(fn) {
	consola.info('start bumping alpha version...')
	// if already has entered pre mode, delete and re-enter
	if (fs.existsSync(rootChangesetPre)) {
		await execa('rm', ['.changeset/pre.json'], { stdio: 'inherit' })
		consola.info('deleted pre.json')
	}
	await execa('yarn', ['changeset', 'pre', 'enter', 'alpha'], { stdio: 'inherit' })
	await execa('yarn', ['changeset', 'version'], { stdio: 'inherit' })
	fn()
	// git add && push
	await execa('git', ['add', '.'], { stdio: 'inherit' })
	await execa('git', ['commit', '-m', 'chore(changeset): 🦋 bump version for alpha'], { stdio: 'inherit' })
	if (argv['git-push'] === undefined || argv['git-push'] === true) {
		await execa('git', ['push'], { stdio: 'inherit' })
	}
	consola.success('bump version successfully')
}

/**
 *
 * @param {*} fn run after changeset version
 */
async function bumpVersionForRelease(fn) {
	consola.info('start bumping release version...')
	if (fs.existsSync(rootChangesetPre)) {
		// 删除 pre.json 后，在 bump version for release 时不会将所有的 alpha 都转成 release
		await execa('rm', ['.changeset/pre.json'], { stdio: 'inherit' })
		consola.info('deleted pre.json')
	}
	await execa('yarn', ['changeset', 'version'], { stdio: 'inherit' })
	fn()
	// git add && push
	try {
		await execa('git', ['add', '.'], { stdio: 'inherit' })
		await execa('git', ['commit', '-m', 'chore(changeset): 🦋 bump version for release'], { stdio: 'inherit' })
	} catch (error) {
		consola.info('there is nothing to commit')
	}

	if (argv['git-push'] === undefined || argv['git-push'] === true) {
		await execa('git', ['push'], { stdio: 'inherit' })
	}
	consola.success('bump version successfully')
}

function hiddenChangesets() {
	if (!argv.filter) return () => {}
	const mdRegex = /\s*---([\s\S]*?)\n\s*---(\s*(?:\n|$)[\s\S]*)/

	const changesetPaths = fg
		.sync(`${path.join(process.cwd(), '.changeset')}/*.md`, { onlyFiles: true })
		.filter((file) => !file.startsWith('.') && file.endsWith('.md') && !file.endsWith('README.md'))

	const needHiddenPaths = changesetPaths.reduce((acc, filePath) => {
		const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
		const [_, roughRelease] = mdRegex.exec(content)
		if (micromatch.contains(roughRelease, argv.filter)) {
			consola.info(`filePath:${filePath} is matched`)
			return acc
		}
		acc.push(filePath)
		return acc
	}, [])

	consola.info('needHiddenPaths', needHiddenPaths)
	// hardcode: 将无需 bump 的文件后缀名改为 mdx，changeset 就消费不到
	const mdxFiles = needHiddenPaths.map((filePath) => {
		const replaceFilePath = filePath.replace('.md', '.mdx')
		fs.renameSync(filePath, replaceFilePath)
		return replaceFilePath
	})
	return () => {
		mdxFiles.forEach((filePath) => fs.renameSync(filePath, filePath.replace('.mdx', '.md')))
	}
}

async function main() {
	const restore = hiddenChangesets()
	if (argv.alpha) {
		await bumpVersionForAlpha(restore)
	} else {
		await bumpVersionForRelease(restore)
	}
}

main()
