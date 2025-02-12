import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					// 把 React 相关包单独打包
					reactVendor: ['react', 'react-dom'],
				},
			},
		},
	},
})
