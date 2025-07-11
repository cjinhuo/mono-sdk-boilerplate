const minimist = require('minimist')

const execa = require('execa').execa
// import { execa } from 'execa'

const argv = minimist(process.argv.slice(2))

const MESSAGE_PREFIX = `chore(changeset): 🦋`

/**
 * 
 * @param {*} changeset 
  //   {
  //   confirmed: true,
  //   summary: 'aaaaa',
  //   releases: [ { name: '@mono/parser-view', type: 'patch' } ]
  // }
 * @returns 
 */
async function getAddMessage(changeset) {
	if (!changeset.confirmed) return ''
	argv['auto-commit'] && (await execa('git', ['commit', '-m', changeset.summary], { stdio: 'inherit' }))
	return `${MESSAGE_PREFIX} ${changeset.releases.map((release) => `${release.name}:${release.type}`).join(',')}`
}

/**
 *
 * @param {*} changeset
  // { changesets:
  //  [ { releases: [ { name: '@mono/shared', type: 'minor' } ],
  //      summary: '1111',
  //      id: 'itchy-maps-compete' } ],
  // releases:
  //  [ { name: '@mono/shared',
  //      type: 'minor',
  //      oldVersion: '1.1.0',
  //      changesets: [ 'itchy-maps-compete' ],
  //      newVersion: '1.2.0' }]
 *
 * @returns chore(changesets):'${name}:${oldVersion}->${newVersion}'
 */
async function getVersionMessage(changeset) {
	// It is not possible to avoid empty commits using the getVersionMessage return value in a changeset
	if (!Array.isArray(changeset.releases) || !changeset.releases.length) return 'chore(changeset): empty release'
	const releases = changeset.releases.filter((release) => release.type !== 'none')
	return `${MESSAGE_PREFIX} ${releases
		.map((release) => `${release.name}:${release.oldVersion}->${release.newVersion}`)
		.join(',')}`
}
// - 当有人创建changeset时，会自动提交，消息格式如： chore(changeset): 🦋 @package-name:patch
// - 当版本更新时，会自动提交，消息格式如： chore(changeset): 🦋 @package-name:1.0.0->1.0.1
module.exports = {
	getAddMessage,
	getVersionMessage,
}
