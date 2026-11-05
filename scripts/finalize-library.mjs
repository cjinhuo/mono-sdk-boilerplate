import { readFileSync, writeFileSync } from 'node:fs'

// Keep the legacy browser/bundler filename and expose unambiguous native ESM.
const esm = readFileSync('dist/index.esm.js', 'utf8')
writeFileSync('dist/index.mjs', esm.replace('sourceMappingURL=index.esm.js.map', 'sourceMappingURL=index.mjs.map'))
const map = JSON.parse(readFileSync('dist/index.esm.js.map', 'utf8'))
writeFileSync('dist/index.mjs.map', JSON.stringify({ ...map, file: 'index.mjs' }))
const declaration = readFileSync('dist/index.d.ts', 'utf8')
const declarationMap = JSON.parse(readFileSync('dist/index.d.ts.map', 'utf8'))
for (const extension of ['mts', 'cts']) {
	const filename = `index.d.${extension}`
	writeFileSync(
		`dist/${filename}`,
		declaration.replace('sourceMappingURL=index.d.ts.map', `sourceMappingURL=${filename}.map`)
	)
	writeFileSync(`dist/${filename}.map`, JSON.stringify({ ...declarationMap, file: filename }))
}
