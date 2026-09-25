import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'

type MergeRule = {
    pattern: string | Array<string>
    merge: (existingContent: string, newContent: string) => string
}

type CopyDirOptions = {
    source: string
    target: string
    ignoreFiles?: Array<string>
    mergeRules?: Array<MergeRule>
}

const GLOBAL_IGNORED_FILES = [
    '**/node_modules/**',
    '**/.DS_Store',
]


export async function copyDir (options: CopyDirOptions): Promise<void> {
    const { source, target, mergeRules, ignoreFiles } = options

    const ignorePatterns = [...GLOBAL_IGNORED_FILES, ...(ignoreFiles ?? [])]

    const sourceEntitiesList = await fs.readdir(source, { recursive: true, withFileTypes: true })
    const sourceFiles = sourceEntitiesList
        .filter(dirent => dirent.isFile())
        .map(dirent => path.relative(source, path.join(dirent.parentPath, dirent.name)))
        .filter(file => !ignorePatterns.some(pattern => path.matchesGlob(file, pattern)))

    async function _copyFile (file: string) {
        const sourcePath = path.join(source, file)
        const targetPath = path.join(target, file)

        if (existsSync(targetPath)) {
            const mergeRule = mergeRules?.find(rule => {
                const patterns = Array.isArray(rule.pattern) ? rule.pattern : [rule.pattern]
                return patterns.some(pattern => path.matchesGlob(file, pattern))
            })

            if (mergeRule) {
                const [existingContent, newContent] = await Promise.all([
                    fs.readFile(targetPath, 'utf8'),
                    fs.readFile(sourcePath, 'utf8'),
                ])
                const mergedContent = mergeRule.merge(existingContent, newContent)

                return fs.writeFile(targetPath, mergedContent, { encoding: 'utf8' })
            }
        }

        await fs.mkdir(path.dirname(targetPath), { recursive: true })
        return fs.copyFile(sourcePath, targetPath)
    }

    await Promise.all(sourceFiles.map((file) => _copyFile(file)))
}