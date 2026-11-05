import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

test('the production core demo preserves arithmetic and string classification', async ({ page }) => {
	await page.goto('http://127.0.0.1:6060')
	await expect(page.locator('#test-core-result')).toHaveText('0')
	await page.locator('#test-core-button').click()
	await expect(page.locator('#test-core-result')).toHaveText('2')
	await page.locator('#test-core-button').click()
	await expect(page.locator('#test-core-result')).toHaveText('4')
	await expect(page.locator('#test-core-string')).toContainText('is string')
	await expect(page.locator('#test-core-non-string')).toContainText('is non-string')
})

for (const [mode, port] of [
	['production', 5173],
	['development', 5174],
] as const) {
	test(`the ${mode} React demo consumes the SDK and remains interactive`, async ({ page }) => {
		await page.goto(`http://127.0.0.1:${port}`)
		await expect(page.getByText('1 + 2 = 6', { exact: true })).toBeVisible()
		await page.getByRole('button', { name: 'count is 0' }).click()
		await expect(page.getByRole('button', { name: 'count is 1' })).toBeVisible()
	})
}

test('legacy IIFE artifacts execute in a real browser without a module loader', async ({ page }) => {
	for (const name of ['shared', 'core', 'web', 'react']) {
		await page.goto('about:blank')
		await page.addScriptTag({
			path: fileURLToPath(new URL(`../../packages/${name}/dist/index.min.js`, import.meta.url)),
		})
		const result = await page.evaluate((packageName) => {
			const sdk = Reflect.get(window, '_GLOBAL_')
			return {
				value:
					packageName === 'shared'
						? sdk.isString('text')
						: packageName === 'core'
							? sdk.coreAdd(1, 2)
							: packageName === 'web'
								? sdk.webAdd(1, 2)
								: sdk.reactAdd(1, 2),
				instrumented: '__coverage__' in window,
			}
		}, name)
		expect(result).toEqual({ value: name === 'shared' ? true : name === 'react' ? 6 : 3, instrumented: false })
	}
})
