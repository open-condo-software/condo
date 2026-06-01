import path from 'path'

export function resolvePathInside (baseDir: string, ...segments: string[]): string {
    const resolvedPath = path.resolve(baseDir, ...segments)
    const relativePath = path.relative(baseDir, resolvedPath)
    const isOutsideBaseDir = relativePath.startsWith('..') || path.isAbsolute(relativePath)

    if (isOutsideBaseDir) {
        throw new Error(`Resolved path escapes base directory: ${resolvedPath}`)
    }

    return resolvedPath
}
