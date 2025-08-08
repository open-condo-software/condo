import { createRequire } from 'node:module'

import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import babel from 'rollup-plugin-babel'
import bundleSize from 'rollup-plugin-bundle-size'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import nodeResolve from 'rollup-plugin-node-resolve'

const require = createRequire(import.meta.url)

const pkg = require('./package.json')

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const ENTRY_MODULE_PATH = './src/index.ts'
const ENTRY_BROWSER_PATH = './src/browser.ts'
const OUT_BROWSER_PATH = './dist/browser.min.js'

const getPluginsPipeLine = (tsDeclarations = false) => [
    typescript(
        tsDeclarations ? {
            compilerOptions: {
                declaration: true,
                declarationDir: 'types',
            },
        } : {
            compilerOptions: {
                declaration: false,
                declarationMap: false,
            },
        }
    ),
    babel(),
    json(),
    nodeResolve({ mainFields: ['jsnext', 'module'] }),
    commonjs(),
    bundleSize(),
]

const cjs = {
    plugins: IS_PRODUCTION ? [...getPluginsPipeLine(true), terser()] : getPluginsPipeLine(true),
    input: ENTRY_MODULE_PATH,
    output: {
        sourcemap: true,
        exports: 'named',
        file: pkg.main,
        format: 'cjs',
    },
}

const esm = {
    plugins: getPluginsPipeLine(),
    input: ENTRY_MODULE_PATH,
    output: {
        sourcemap: true,
        file: pkg.module,
        format: 'es',
    },
}

const umd = {
    plugins: IS_PRODUCTION ? [...getPluginsPipeLine(), terser()] : getPluginsPipeLine(true),
    input: ENTRY_MODULE_PATH,
    output: {
        sourcemap: true,
        exports: 'named',
        name: pkg.name,
        file: pkg.browser,
        format: 'umd',
    },
}

const browser = {
    plugins: [...getPluginsPipeLine(), terser()],
    input: ENTRY_BROWSER_PATH,
    output: {
        sourcemap: true,
        file: OUT_BROWSER_PATH,
        format: 'iife',
    },
}

export default IS_PRODUCTION ? [cjs, esm, umd, browser] : [umd]
