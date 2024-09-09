import fs from 'fs'
import path from 'path'

import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import { uglify } from 'rollup-plugin-uglify'

import pkg from './package.json' assert { type: 'json' }

const AVAILABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']

function getFileExtension (path) {
    const ext =  AVAILABLE_EXTENSIONS.find(ext => fs.existsSync(`${path}${ext}`))
    if (!ext) throw new Error('Unknown extension')

    return `${path}${ext}`
}

/** @type {Array<import('rollup').RollupOptions>} */
const options =  Object.entries(pkg.exports).map(([relativeImport, relativeMap]) => {
    const input = getFileExtension(path.join('src', relativeImport))
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
            commonjs(),
            babel({
                babelHelpers: 'bundled',
                exclude: 'node_modules/**',
                presets: [['@babel/preset-react', { 'runtime': 'automatic' }]],
                extensions: AVAILABLE_EXTENSIONS,
            }),
            typescript({ tsconfig: './tsconfig.json' }),
            uglify(),
        ],
        external: ['react', 'react-dom'],
    }
})

export default options
