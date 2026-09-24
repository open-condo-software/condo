import { resolve, join, sep } from 'path'

type PackagePathResult = {
    packageName: string
    absolutePath: string
}

/**
 * Extracts package name and resolves absolute path, omitting scope from folder name.
 * Works cross-platform (Windows and Unix).
 */
export function resolvePackagePath (packageNameOrPath: string): PackagePathResult {
    // Resolve to absolute path first (handles Windows backslashes and relative paths)
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
            absolutePath: join(resolvedPath, '../..', name),
        }
    }

    return {
        packageName: segments[segments.length - 1],
        absolutePath: resolvedPath,
    }
}
