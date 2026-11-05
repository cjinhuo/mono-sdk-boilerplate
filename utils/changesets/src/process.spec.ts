import { expect, test } from 'vitest'
import { runProcess } from './process'

test('returns real subprocess stdout', async () => {
	const result = await runProcess(process.execPath, ['-e', 'process.stdout.write("ready")'])
	expect(result.stdout).toBe('ready')
})

test('preserves subprocess failures for release callers', async () => {
	await expect(runProcess(process.execPath, ['-e', 'process.exit(9)'])).rejects.toMatchObject({ exitCode: 9 })
})
