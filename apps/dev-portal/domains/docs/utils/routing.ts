import fs from 'fs'
import path from 'path'

import { DEFAULT_LOCALE } from 'domains/common/constants/locales'
import uniq from 'lodash/uniq'
import getTitle from 'title'


function getFileNameRegexp (locale: string): RegExp {
    return new RegExp(`\\.(?:${locale}|${DEFAULT_LOCALE}).mdx?$`, 'i')
}

export type NavItem = {
    label: string
    route: string
    external?: boolean
    children?: Array<NavItem>
}

type FileInfo = {
    name: string
    isDir: boolean
}

type ItemDescription =
    string | // File name mapping
    { href: string, title: string } // External resource

function _fileComparer (lhs: FileInfo, rhs: FileInfo) {
    if (lhs.name < rhs.name) {
        return -1
    } else if (lhs.name === rhs.name) {
        return 0
    } else {
        return 1
    }
}

export function getNavTree (dir: string, locale: string, rootDir: string): Array<NavItem> {
    const fileRegexp = getFileNameRegexp(locale)
    // Extract all files in dir
    const filePaths = fs.readdirSync(dir, { withFileTypes: true })
    // Filter MD files without extension
    const files = uniq(filePaths
        .filter(file => {
            return file.isFile() && fileRegexp.test(file.name)
        })
        .map(file => file.name.split('.')[0]))
    // Filter dirs
    const dirs = filePaths
        .filter(file => file.isDirectory())
        .map(file => file.name)
    // Obtain meta info
    const metaPath = path.join(dir, `_meta.${locale}.json`)
    const meta: Record<string, ItemDescription> = fs.existsSync(metaPath)
        ? JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        : {}
    const result: Array<NavItem> = []

    // Process meta
    for (const [key, value] of Object.entries(meta)) {
        if (files.includes(key) && typeof value === 'string') {
            files.splice(files.indexOf(key), 1)
            result.push({
                label: value,
                route: path.relative(rootDir, path.join(dir, key)),
            })

        } else if (dirs.includes(key) && typeof value === 'string') {
            dirs.splice(dirs.indexOf(key), 1)
            const children = getNavTree(path.join(dir, key), locale, rootDir)
            if (children.length) {
                result.push({
                    label: value,
                    route: path.relative(rootDir, path.join(dir, key)),
                    children,
                })
            }
        } else if (typeof value === 'object' && 'title' in value && 'href' in value) {
            result.push({
                label: value.title,
                route: value.href,
                external: true,
            })
        }
    }

    // Sort rest of the files (was not in meta) alphabetically
    const restFiles: Array<FileInfo> = [
        ...files.map(name => ({ name, isDir: false })),
        ...dirs.map(name => ({ name, isDir: true })),
    ]
    restFiles.sort(_fileComparer)

    // Process rest of the files using title pkg for generation titles
    for (const fileInfo of restFiles) {
        const label = getTitle(fileInfo.name)
        const route = path.relative(rootDir, path.join(dir, fileInfo.name))

        if (fileInfo.isDir) {
            const children = getNavTree(path.join(dir, fileInfo.name), locale, rootDir)
            if (children.length) {
                result.push({ label, route, children })
            }
        } else {
            result.push({ label, route })
        }
    }

    return result
}

export function *getAllRoutes (dir: string, locale: string, rootDir: string): IterableIterator<string> {
    const fileRegexp = getFileNameRegexp(locale)
    const files = fs.readdirSync(dir, { withFileTypes: true })
    const includedFiles: Array<string> = []
    for (const file of files) {
        if (file.isDirectory()) {
            yield *getAllRoutes(path.join(dir, file.name), locale, rootDir)
        } else if (file.isFile() && fileRegexp.test(file.name)) {
            const filePrefix = file.name.split('.')[0]
            if (!includedFiles.includes(filePrefix)) {
                includedFiles.push(filePrefix)
                yield path.relative(rootDir, path.join(dir, filePrefix))
            }
        }
    }
}