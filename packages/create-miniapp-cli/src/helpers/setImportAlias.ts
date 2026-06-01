import fs from 'fs'
import path from 'path'

import { resolvePathInside } from '../utils/resolvePathInside.js'

const BINARY_FILE_EXTENSIONS = new Set([
    '.avif',
    '.gif',
    '.ico',
    '.jpeg',
    '.jpg',
    '.pdf',
    '.png',
    '.pyc',
    '.ttf',
    '.webp',
    '.woff',
    '.woff2',
])

function isBinaryFile (filePath: string): boolean {
    if (BINARY_FILE_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
        return true
    }

    const chunk = fs.readFileSync(filePath)
    return chunk.includes(0)
}

export function replaceTextInFiles (
    directoryPath: string,
    search: string,
    replacement: string,
    rootDirectoryPath = directoryPath,
): void {
    const files = fs.readdirSync(directoryPath)

    files.forEach((file) => {
        const filePath = resolvePathInside(directoryPath, file)
        const absolutePath = resolvePathInside(rootDirectoryPath, path.relative(rootDirectoryPath, filePath))
        if (fs.statSync(filePath).isDirectory()) {
            replaceTextInFiles(filePath, search, replacement, rootDirectoryPath)
        } else {
            if (isBinaryFile(filePath)) return
            const data = fs.readFileSync(filePath, 'utf8')
            const updatedData = data.split(search).join(replacement)
            if (updatedData !== data) {
                fs.writeFileSync(absolutePath, updatedData, 'utf8')
            }
        }
    })
}

export const setImportAlias = (projectDir: string, importAlias: string, appName: string) => {
    const normalizedImportAlias = importAlias
        .replace(/\*/g, '') // remove any wildcards (~/* -> ~/)
        .replace(/[^/]$/, '$&/') // ensure trailing slash (@ -> ~/)

    // update import alias in any files if not using the default
    replaceTextInFiles(projectDir, '~/', normalizedImportAlias)
    replaceTextInFiles(projectDir, `@app/${normalizedImportAlias}`, `@app/${appName}/`)
    replaceTextInFiles(projectDir, `@app/${appName}/^`, `@app/${appName}^`)
}
