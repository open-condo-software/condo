import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/cli.ts'],
    clean: true,
    dts: true,
    sourcemap: true,
    format: ['cjs', 'esm'],
    target: 'node16',
    minify: true,
})