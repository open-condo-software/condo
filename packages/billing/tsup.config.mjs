import fs from 'fs'
import { createRequire } from 'node:module'
import path from 'path'

import { defineConfig } from 'tsup'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')
const AVAILABLE_EXTENSIONS = ['.ts']

function getInputFileFromExports (exportsPath) {
    const isDirectory = fs.existsSync(exportsPath) && fs.lstatSync(exportsPath).isDirectory()
    // NOTE: inputs are controlled by package.json exports field
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const pathToFile = isDirectory ? path.join(exportsPath, 'index') : exportsPath

    const ext = AVAILABLE_EXTENSIONS.find(ext => fs.existsSync(`${pathToFile}${ext}`))
    if (!ext) throw new Error('Unknown extension')

    // NOTE: tsup expect linux-styled path with "/"
    // https://github.com/egoist/tsup/pull/1300
    return `${pathToFile}${ext}`.split(path.win32.sep).join(path.posix.sep)
}

export default defineConfig({
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    entry: Object.keys(pkg.exports).map(entry => getInputFileFromExports(path.join('.', 'src', entry))),
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
