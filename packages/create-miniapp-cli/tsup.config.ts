import { defineConfig } from 'tsup'

export default defineConfig({
    clean: true,
    entry: ['src/index.ts'],
    format: ['esm'],
    minify: true,
    target: 'esnext',
    outDir: 'dist',
    onSuccess: 'node dist/index.js', // TODO: remove for prod
})
