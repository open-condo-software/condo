import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/**/*.ts', '!./src/**/*.d.ts', '!./src/**/*.spec.ts'],
    outDir: './dist/',
    clean: true,
    dts: true,
    sourcemap: true,
    // `splitting` should be false, it ensures we are not getting any `chunk-*` files in the output.
    splitting: false,
    format: ['cjs', 'esm'],
    target: 'node16',
    minify: true,
})
