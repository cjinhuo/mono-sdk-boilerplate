import { readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

for (const directory of ['packages', 'app', 'utils', 'e2e/demos']) {
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue
		for (const output of ['dist', 'esm', 'tsconfig.tsbuildinfo']) {
			rmSync(join(directory, entry.name, output), { recursive: true, force: true })
		}
	}
}
for (const directory of ['coverage', 'e2e/test-results', 'e2e/playwright-report']) {
	rmSync(directory, { recursive: true, force: true })
}
