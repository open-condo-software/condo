import { readdirSync, readFileSync, existsSync, statSync } from 'fs'
import { resolve, join, sep, basename } from 'path'

type PackagePathResult = {
    packageName: string
    absolutePath: string
}

type GetAvailableTemplatesOptions = {
    showHidden?: boolean
}

type TemplateInfo = {
    id: string
    name: string
    description?: string
    extends?: string
    hidden?: boolean
    examples?: Array<string>
}

/**
 * Extracts package name and resolves absolute path, omitting scope from folder name.
 * Works cross-platform (Windows and Unix).
 */
export function resolvePackagePath (packageNameOrPath: string): PackagePathResult {
    // Resolve to absolute path first (handles Windows backslashes and relative paths)
    // NOTE: expected traversal
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const resolvedPath = resolve(packageNameOrPath)
    
    // Split on OS separator only (after resolve, all separators are OS-specific)
    const segments = resolvedPath.split(sep)

    // Check if the last segment is part of a scoped package
    // A scoped package has the form @scope/name (2 segments)
    if (segments.length >= 2 && segments[segments.length - 2].startsWith('@')) {
        // Last 2 segments form a scoped package
        const scope = segments[segments.length - 2]
        const name = segments[segments.length - 1]
        const packageName = `${scope}/${name}`

        return {
            packageName,
            // NOTE: omitting scope from path (/some/dir/@app/name -> /some/dir/name)
            // NOTE: controlled traversal
            // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
            absolutePath: join(resolvedPath, '../..', name),
        }
    }

    return {
        packageName: segments[segments.length - 1],
        absolutePath: resolvedPath,
    }
}

export function resolveTemplatesDir () {
    const fileFolderName = basename(__dirname)
    // NOTE: this is for development, resolving from src
    if (fileFolderName === 'utils') {
        return join(__dirname, '../..', 'templates')
    }

    // NOTE: this is for production, resolving from dist
    return __dirname
}

function sortTemplates (templates: Array<TemplateInfo>, rootTemplate?: string) {
    const currentLevelTemplates = templates
        .filter(t => rootTemplate ? t.extends === rootTemplate : !t.extends)
        .toSorted((a, b) => a.name.localeCompare(b.name))

    return currentLevelTemplates.reduce((acc, cur) => {
        acc.push(cur)
        acc.push(...sortTemplates(templates, cur.id))
        return acc
    }, [] as Array<TemplateInfo>)
}

export function getAvailableTemplates (opts?: GetAvailableTemplatesOptions): Array<TemplateInfo> {
    const { showHidden } = opts ?? {}
    const templatesDir = join(resolveTemplatesDir(), 'templates')
    const appTemplates = readdirSync(templatesDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(dirent => dirent.name)

    const allTemplates: Array<TemplateInfo> = []

    for (const templateName of appTemplates) {
        const metaPath = join(templatesDir, templateName, '_meta.json')
        if (!existsSync(metaPath)) continue
        const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))

        allTemplates.push({
            id: templateName,
            name: meta.name ?? templateName,
            description: meta.description ?? null,
            extends: meta.extends ?? null,
            hidden: meta.hidden ?? false,
            examples: meta.examples ?? null,
        })
    }

    return sortTemplates(allTemplates).filter(t => !t.hidden || showHidden)
}

export function isEmptyDir (dirPath: string): boolean {
    return existsSync(dirPath) && statSync(dirPath).isDirectory() && readdirSync(dirPath).length === 0
}