import fs from 'fs'
import path from 'path'

import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

import pkg from './package.json' assert { type: 'json' }

const AVAILABLE_EXTENSIONS = ['.ts', '.tsx']

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
            typescript({ tsconfig: './tsconfig.json', compilerOptions: { declaration: false } }),
        ],
        external: ['react', 'react-dom'],
    }
})

export default options