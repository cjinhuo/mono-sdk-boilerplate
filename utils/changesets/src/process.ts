interface ProcessOptions {
	cwd?: string
	stdio?: 'pipe' | 'inherit'
}

// Keep public hooks CommonJS-compatible while using Execa's current ESM API.
export async function runProcess(command: string, args: string[], options: ProcessOptions = {}) {
	const { execa } = await import('execa')
	const result = await execa(command, args, options)
	return { stdout: result.stdout ?? '' }
}
