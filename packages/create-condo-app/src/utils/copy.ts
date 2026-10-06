import { existsSync, readFileSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'

import { glob } from 'glob'

import { getConfig } from './config'
import { resolveTemplatesDir } from './fs'
import { mergePackageJson, mergeTranslations } from './merge'

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

    // NOTE: glob is used to respect .gitignore patterns
    const filesToCopy = await glob('**/*', { ignore: ignorePatterns, cwd: source, absolute: true, nodir: true })
    const sourceFiles = filesToCopy.map((filePath) => path.relative(source, filePath))

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

export async function copyAppDir (srcPath: string) {
    const { projectPath, preferences } = getConfig()
    const ignoredFiles = [
        '_meta.json',
    ]

    const gitIgnorePath = path.join(srcPath, '.gitignore')

    if (!preferences.agentsMd) {
        ignoredFiles.push('AGENTS.md')
    }

    if (existsSync(gitIgnorePath)) {
        // TODO: handle glob patterns, next is leaking
        const ignoredContent = readFileSync(gitIgnorePath, 'utf8')
        const lines = ignoredContent.split('\n')
            .map(l => l.trim())
            .filter(l => l.length && !l.startsWith('#'))
        if (lines.length) {
            ignoredFiles.push(...lines)
        }
    }

    await copyDir({
        source: srcPath,
        target: projectPath,
        ignoreFiles: ignoredFiles,
        mergeRules: [
            {
                pattern: 'lang/**/*.json',
                merge: mergeTranslations,
            },
            {
                pattern: 'package.json',
                merge: mergePackageJson,
            },
            // TODO: merge agents.md
        ],
    })
}

export async function copyAppTemplate (templateName: string) {
    const templatesDir = resolveTemplatesDir()
    const templateRootDir = path.join(templatesDir, 'templates', templateName)
    const metaFile = path.join(templateRootDir, '_meta.json')

    // If template extends another template, copy that first
    if (existsSync(metaFile)) {
        const meta = JSON.parse(await fs.readFile(metaFile, 'utf8'))
        if (typeof meta?.extends === 'string') {
            await copyAppTemplate(meta.extends)
        }

    }

    await copyAppDir(templateRootDir)
}