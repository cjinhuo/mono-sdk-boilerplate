/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	rootDir: '../..',
	transform: {
		'^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.test.json' }],
	},
	moduleFileExtensions: ['js', 'ts'],
	testMatch: ['<rootDir>/utils/changesets/src/**/*.spec.ts'],
}
