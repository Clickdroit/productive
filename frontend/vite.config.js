import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: '/productive/',
    server: {
        port: 5173,
        proxy: {
            '/prod/api': {
                target: 'http://localhost:3003',
                changeOrigin: true,
            },
        },
    },
})
