import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { workspaceAliases } from '../../utils/vite/library.ts'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: { alias: workspaceAliases },
})
