import fs from 'fs'
import { createRequire } from 'node:module'
import path from 'path'

import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

const require = createRequire(import.meta.url)

const pkg = require('./package.json')

const AVAILABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']

function getInputFileFromExports (exportsPath) {
    const isDirectory = fs.existsSync(exportsPath) && fs.lstatSync(exportsPath).isDirectory()
    // NOTE: inputs are controlled by package.json exports field
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const pathToFile = isDirectory ? path.join(exportsPath, 'index') : exportsPath

    const ext =  AVAILABLE_EXTENSIONS.find(ext => fs.existsSync(`${pathToFile}${ext}`))
    if (!ext) throw new Error('Unknown extension')

    return `${pathToFile}${ext}`
}

/** @type {Array<import('rollup').RollupOptions>} */
const options =  Object.entries(pkg.exports).map(([relativeImport, relativeMap]) => {
    const input = getInputFileFromExports(path.join('src', relativeImport))
    const output = []
    if (relativeMap && relativeMap.require) {
        output.push({
            file: relativeMap.require,
            format: 'cjs',
            sourcemap: true,
        })
    }
    if (relativeMap && relativeMap.import) {
        output.push({
            file: relativeMap.import,
            format: 'esm',
            sourcemap: true,
        })
    }

    return {
        input,
        output,
        plugins: [
            peerDepsExternal(),
            resolve(),
            commonjs({
                transformMixedEsModules: true,
                esmExternals: true,
            }),
            babel({
                babelHelpers: 'bundled',
                exclude: 'node_modules/**',
                presets: [['@babel/preset-react', { 'runtime': 'automatic' }]],
                extensions: AVAILABLE_EXTENSIONS,
            }),
            typescript({ tsconfig: './tsconfig.json', compilerOptions: { declaration: false } }),
            terser(),
        ],
        external: ['react', 'react-dom'],
    }
})

export default options