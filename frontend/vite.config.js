import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Productive Dashboard',
                short_name: 'Productive',
                description: 'Dashboard tout-en-un de productivité',
                theme_color: '#09090b',
                background_color: '#09090b',
                display: 'standalone',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
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
