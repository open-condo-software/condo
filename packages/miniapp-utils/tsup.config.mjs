import fs from 'fs'
import { createRequire } from 'node:module'
import path from 'path'

import { defineConfig } from 'tsup'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')
const AVAILABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']

function getInputFileFromExports (exportsPath) {
    const isDirectory = fs.existsSync(exportsPath) && fs.lstatSync(exportsPath).isDirectory()
    // NOTE: inputs are controlled by package.json exports field
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const pathToFile = isDirectory ? path.join(exportsPath, 'index') : exportsPath

    const ext = AVAILABLE_EXTENSIONS.find(ext => fs.existsSync(`${pathToFile}${ext}`))
    if (!ext) throw new Error('Unknown extension')

    return `${pathToFile}${ext}`
}

export default defineConfig({
    entry: Object.keys(pkg.exports).map(entry => getInputFileFromExports(path.join('src', entry))),
    clean: true,
    dts: true,
    sourcemap: true,
    splitting: false,
    format: ['cjs', 'esm'],
    target: 'node16',
    minify: false,
    external: Object.keys(pkg.peerDependencies),
})