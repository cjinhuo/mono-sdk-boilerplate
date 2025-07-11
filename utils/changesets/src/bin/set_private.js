#!/usr/bin/env node
const fs = require('fs')

const consola = require('consola')
const fg = require('fast-glob')
const micromatch = require('micromatch')
const minimist = require('minimist')

const argv = minimist(process.argv.slice(2))

function getAllPackages() {
	const packagePaths = fg.sync(`${process.cwd()}/packages/**`, {
		cwd: 'dir',
		deep: 1,
		onlyDirectories: true,
	})
	return packagePaths.map((path) => ({
		path: `${path}/package.json`,
		name: require(`${path}/package.json`).name,
	}))
}

async function modifyPackageJson(path) {
	// rewrite package.json private to true
	const packageJson = require(path)
	packageJson.private = true
	fs.writeFileSync(path, JSON.stringify(packageJson, null, 2))
}

async function main() {
	// todo 添加 ignore 使 filter 命令反转，--ignore=@slardar/web，可定点指定需要发布的包
	const filter = argv.filter
	if (!filter) return

	const packages = getAllPackages()
	packages
		.filter((pkg) => micromatch.isMatch(pkg.name, filter))
		.forEach(({ path }) => {
			consola.info('set private true:', path)
			modifyPackageJson(path)
		})
}
main()
