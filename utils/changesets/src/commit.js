const MESSAGE_PREFIX = `chore(changeset): 🦋`

/**
 * 
 * @param {*} changeset 
  //   {
  //   confirmed: true,
  //   summary: 'aaaaa',
  //   releases: [ { name: '@mono/parser-view', type: 'patch' } ]
  // }
  // - 当有人创建changeset时（运行 pnpm changeset），会自动提交，消息格式如： chore(changeset): 🦋 @package-name:patch
 * @returns git message
 */
async function getAddMessage(changeset) {
	console.log('------------getAddMessage----------', changeset)
	if (!changeset.confirmed) return ''
	// 在 changeset 内存会通过 [spawn] 调用 git add 和 git commit
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
  //  当版本更新时（运行 pnpm changeset version），会自动提交，消息格式如： chore(changeset): 🦋 @package-name:1.0.0->1.0.1
 *
 * @returns chore(changesets):'${name}:${oldVersion}->${newVersion}'
 */
async function getVersionMessage(changeset) {
	console.log('------------getVersionMessage----------', changeset)
	// It is not possible to avoid empty commits using the getVersionMessage return value in a changeset
	if (!Array.isArray(changeset.releases) || !changeset.releases.length) return 'chore(changeset): empty release'
	// 在 changeset 内存会通过 [spawn] 调用 git add 和 git commit
	return `${MESSAGE_PREFIX} ${releases
		.map((release) => `${release.name}:${release.oldVersion}->${release.newVersion}`)
		.join(',')}`
}
module.exports = {
	getAddMessage,
	getVersionMessage,
}
