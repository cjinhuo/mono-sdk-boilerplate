#!/usr/bin/env node

const consola = require('consola')
const minimist = require('minimist')

const { execa } = require('@slardar/scripts')

const argv = minimist(process.argv.slice(2))

async function main() {
	consola.info('start publishing...')

	if (argv['git-tag'] === false) {
		await execa('yarn', ['changeset', 'publish', '--no-git-tag'], { stdio: 'inherit' })
	} else {
		await execa('yarn', ['changeset', 'publish'], { stdio: 'inherit' })
		consola.info('git push --follow-tags...')
		await execa('git', ['push', '--follow-tags'], { stdio: 'inherit' })
	}

	consola.info('publish successfully')
}

main()
