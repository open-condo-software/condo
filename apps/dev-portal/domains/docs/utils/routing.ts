import fs from 'fs'
import path from 'path'

import merge from 'lodash/merge'
import pickBy from 'lodash/pickBy'
import uniq from 'lodash/uniq'
import getTitle from 'title'

import { DEFAULT_LOCALE } from '@/domains/common/constants/locales'


/**
 * Generates regex for searching file by locale with default locale fallback
 * @param locale - current locale
 */
function getFileNameRegexp (locale: string): RegExp {
    // is part of source code reading - no end user input
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    return new RegExp(`\\.(?:${locale}|${DEFAULT_LOCALE}).mdx?$`, 'i')
}

export type NavItem = {
    label: string
    route: string
    external?: boolean
    hidden?: boolean
    children?: Array<NavItem>
}

type FileMetaInfo = {
    name: string
    isDir: boolean
}

type ItemDescription =
    string | // File name mapping via string value
    { title: string } | // File name mapping via title property
    { title: string, href: string,  } | // External resource
    { title: string, hidden: boolean } // Files, which available just from direct url (hidden in menu)

export type ArticleInfo = {
    label: string
    route: string
    hidden?: boolean
}

/**
 * Join dir name and filename into the concatenated path
 * @param dir
 * @param filename
 */
function pathJoin (dir: string, filename: string) {
    // is part of source code reading - no end user input
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    return path.join(dir, filename)
}

/**
 * Get a relative path
 * @param dir
 * @param filename
 */
function pathRelative (dir: string, filename: string) {
    // is part of source code reading - no end user input
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    return path.relative(dir, filename)
}

/**
 * Compares FileMetaInfo by name
 * @param lhs - left-hand side
 * @param rhs - right-hand side
 */
function _fileComparer (lhs: FileMetaInfo, rhs: FileMetaInfo) {
    if (lhs.name < rhs.name) {
        return -1
    } else if (lhs.name === rhs.name) {
        return 0
    } else {
        return 1
    }
}

/**
 * Generates nested articles navigation tree (root node is excluded, so return type is Array of top-level nodes)
 * Recursively:
 * 1. Find all matching doc files and subdirectories in dir
 * 2. Find meta file for specified locale and meta for default locale
 * 3. Merge meta files (first goes meta from specified locale, then from default locale (only keys missing in specified locale)
 * 4. For each key in meta:
 *  i. If it's an existing file, return localized name and its relative path (route)
 *  ii. If it's an existing dir, return localize name, its relative path (route) and trigger function for dir children objects
 *  iii. If it's an external link, return external flag with external route.
 * 5. For each file / dir which was not in meta and left after step 5 doing same process, but title are generated from filename itself
 * and files are sorted alphabetically.
 * Each file / dir can also be hidden by specifying "hidden" property in meta.
 * This way they will appear in nav tree and will be accessible by direct link, but will be hidden visually.
 * @param dir - dir to scan files
 * @param locale - current locale used to generate file regex
 * @param rootDir - root dir to generate routes (relative paths)
 */
export function getNavTree (dir: string, locale: string, rootDir: string): Array<NavItem> {
    const fileNameRegexp = getFileNameRegexp(locale)
    // Extract all files in dir
    const filePaths = fs.readdirSync(dir, { withFileTypes: true })
    // Filter MD / MDX files in current or default locale without extensions
    const files = uniq(filePaths
        .filter(file => file.isFile() && fileNameRegexp.test(file.name))
        .map(file => file.name.split('.')[0])
    )
    // Filter directories
    const directories = filePaths
        .filter(file => file.isDirectory())
        .map(file => file.name)

    // Obtain meta for current locale and default locale
    const localizedMetaPath = pathJoin(dir, `_meta.${locale}.json`)
    const defaultMetaPath = pathJoin(dir, `_meta.${DEFAULT_LOCALE}.json`)
    const localizedMeta: Record<string, ItemDescription> = fs.existsSync(localizedMetaPath)
        ? JSON.parse(fs.readFileSync(localizedMetaPath, 'utf-8'))
        : {}
    const defaultMeta: Record<string, ItemDescription> = fs.existsSync(defaultMetaPath)
        ? JSON.parse(fs.readFileSync(defaultMetaPath, 'utf-8'))
        : {}
    // Merge localized meta with default (localized first order, localized override priority)
    const localizedKeys = Object.keys(localizedMeta)
    const defaultMetaLeftover = pickBy(defaultMeta, (_, key) => !localizedKeys.includes(key))
    const meta = merge(localizedMeta, defaultMetaLeftover)

    const result: Array<NavItem> = []
    // Process meta info
    for (const [key, item] of Object.entries(meta)) {
        if (files.includes(key)) {
            files.splice(files.indexOf(key), 1)
            if (typeof item === 'string') {
                result.push({
                    label: item,
                    route: pathRelative(rootDir, pathJoin(dir, key)),
                })
            } else {
                result.push({
                    label: item.title,
                    route: pathRelative(rootDir, pathJoin(dir, key)),
                    hidden: 'hidden' in item ? item.hidden : undefined,
                })
            }
        } else if (directories.includes(key)) {
            directories.splice(directories.indexOf(key), 1)
            const children = getNavTree(pathJoin(dir, key), locale, rootDir)
            if (typeof item === 'string') {
                result.push({
                    label: item,
                    route: pathRelative(rootDir, pathJoin(dir, key)),
                    children,
                })
            } else {
                result.push({
                    label: item.title,
                    route: pathRelative(rootDir, pathJoin(dir, key)),
                    hidden: 'hidden' in item ? item.hidden : undefined,
                    children,
                })
            }
        } else if (typeof item === 'object' && 'href' in item) {
            result.push({
                label: item.title,
                route: item.href,
                external: true,
            })
        }
    }

    // Sort rest of the files which was not in localized / default meta alphabetically
    const restFiles: Array<FileMetaInfo> = [
        ...files.map(name => ({ name, isDir: false })),
        ...directories.map(name => ({ name, isDir: true })),
    ]
    restFiles.sort(_fileComparer)

    // Process rest of the files using title package for generation titles
    for (const fileInfo of restFiles) {
        const label = getTitle(fileInfo.name)
        const route = pathRelative(rootDir, pathJoin(dir, fileInfo.name))
        if (fileInfo.isDir) {
            const children = getNavTree(pathJoin(dir, fileInfo.name), locale, rootDir)
            if (children.length) {
                result.push({ label, route, children })
            }
        } else {
            result.push({ label, route })
        }
    }

    return result
}

/**
 * Traverse tree generated by getNavTree function to get flat array of leafs (articles)
 * @param navTree - tree generated by getNavTree
 */
export function *getFlatArticles (navTree: Array<NavItem>): IterableIterator<ArticleInfo> {
    for (const item of navTree) {
        if (item.children) {
            yield *getFlatArticles(item.children)
        } else if (!item.external) {
            // NOTE: undefined is not serializable in props
            yield { label: item.label, route: item.route, hidden: item.hidden || false }
        }
    }
}

/**
 * Finds next non-hidden article starting from (currentIndex + 1) pos
 * @param articles - All articles
 * @param currentIndex - Current index
 */
export function getNextArticle (articles: Array<ArticleInfo>, currentIndex: number): ArticleInfo | null {
    for (let idx = currentIndex + 1; idx < articles.length; ++idx) {
        const article = articles[idx]
        if (!article.hidden) {
            return article
        }
    }

    return null
}

/**
 * Finds previous non-hidden article starting from (currentIndex - 1) pos
 * @param articles - All articles
 * @param currentIndex - Current index
 */
export function getPrevArticle (articles: Array<ArticleInfo>, currentIndex: number): ArticleInfo | null {
    for (let idx = currentIndex - 1; idx >= 0; --idx) {
        const article = articles[idx]
        if (!article.hidden) {
            return article
        }
    }

    return null
}

/**
 * Recursively gets all doc files in folder. Finds localized version or its fallback with default locale.
 * Used for generating docs static paths
 * @param dir - dir to find files in
 * @param locale - current locale
 * @param rootDir - root docs dir to generate relative paths (routes)
 */
export function *getAllRoutes (dir: string, locale: string, rootDir: string): IterableIterator<string> {
    const fileRegexp = getFileNameRegexp(locale)
    const files = fs.readdirSync(dir, { withFileTypes: true })
    const includedFiles: Array<string> = []
    for (const file of files) {
        if (file.isDirectory()) {
            yield *getAllRoutes(pathJoin(dir, file.name), locale, rootDir)
        } else if (file.isFile() && fileRegexp.test(file.name)) {
            const filePrefix = file.name.split('.')[0]
            if (!includedFiles.includes(filePrefix)) {
                includedFiles.push(filePrefix)
                yield pathRelative(rootDir, pathJoin(dir, filePrefix))
            }
        }
    }
}

/**
 * By given current route and built navigation extracts localized nested path like following:
 * 'folder/index' -> ["Section", "PageTitle"]
 * @param route - current page route
 * @param nav - tree generated by getNavTree
 */
export function extractLocalizedTitleParts (route: string, nav: Array<NavItem>): Array<string> {
    const parts = route.split('/')
    let candidates = nav
    const result: Array<string> = []
    for (let i = 0; i < parts.length; ++i) {
        const subRoute = parts.slice(0, i + 1).join('/')
        const matchingNode = candidates.find(node => node.route === subRoute)
        if (matchingNode) {
            result.push(matchingNode.label)
            if (matchingNode.children) {
                candidates = matchingNode.children
            } else {
                return result
            }
        } else {
            return result
        }
    }

    return result
}