import {defineConfig} from 'vitest/config'
import path from 'path'
import swc from 'unplugin-swc'

export default defineConfig({
    plugins: [
        swc.vite(),
    ],
    test: {
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        include: ['**/*.test.ts', '**/*.test.tsx'],
        exclude: ['node_modules', '.next', 'e2e/**', '**/dist/**', '**/coverage/**'],
        // prevent concurrent issue for it tests
        fileParallelism: false,
        poolOptions: {
            threads: {
                singleThread: true,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
})
