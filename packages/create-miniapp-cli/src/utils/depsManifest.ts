import path from 'path'

import * as p from '@clack/prompts'
import fs from 'fs-extra'

import { logger } from './logger.js'
import { resolvePathInside } from './resolvePathInside.js'

import { CONDO_ROOT, PKG_ROOT } from '../consts.js'
import { type PackageJson } from '../types/packageJson.js'

type DepsManifest = Record<string, string>
type SemverPrefix = '^' | '~' | ''
type SemverVersion = {
    major: number
    minor: number
    patch: number
}
type ParsedVersion = {
    prefix: SemverPrefix
    version: SemverVersion
    raw: string
}

const DEPS_MANIFEST_PATH = path.join(PKG_ROOT, 'config/deps-manifest.json')
const YARN_LOCK_PATH = path.join(CONDO_ROOT, 'yarn.lock')

const WORKSPACE_PROTOCOLS = [
    'workspace:',
    'link:',
    'portal:',
    'file:',
    'patch:',
    'npm:',
]

const RANGE_PATTERN = /^(\^|~)?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/

function readDepsManifest (): DepsManifest {
    if (!fs.existsSync(DEPS_MANIFEST_PATH)) {
        throw new Error(`Deps manifest not found at: ${DEPS_MANIFEST_PATH}`)
    }

    return fs.readJSONSync(DEPS_MANIFEST_PATH) as DepsManifest
}

function writeDepsManifest (manifest: DepsManifest) {
    const sortedManifest = Object.fromEntries(
        Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right)),
    )

    fs.writeJSONSync(DEPS_MANIFEST_PATH, sortedManifest, { spaces: 2 })
}

function parseVersionRange (value: string): ParsedVersion | null {
    const trimmed = value.trim()
    if (!trimmed) return null

    if (trimmed.includes('-')) {
        return null
    }

    for (const protocol of WORKSPACE_PROTOCOLS) {
        if (trimmed.startsWith(protocol)) return null
    }

    const match = trimmed.match(RANGE_PATTERN)
    if (!match || !match[2]) return null

    const prefix = (match[1] ?? '') as SemverPrefix
    const major = Number.parseInt(match[2], 10)
    const minor = Number.parseInt(match[3] ?? '0', 10)
    const patch = Number.parseInt(match[4] ?? '0', 10)

    if ([major, minor, patch].some((part) => Number.isNaN(part))) return null

    return {
        prefix,
        raw: trimmed,
        version: { major, minor, patch },
    }
}

function compareVersions (left: SemverVersion, right: SemverVersion): number {
    if (left.major !== right.major) return left.major - right.major
    if (left.minor !== right.minor) return left.minor - right.minor
    return left.patch - right.patch
}

function compareParsedVersions (left: ParsedVersion, right: ParsedVersion): number {
    const diff = compareVersions(left.version, right.version)
    if (diff !== 0) return diff

    const rank = (prefix: SemverPrefix) => {
        if (prefix === '^') return 3
        if (prefix === '~') return 2
        return 1
    }

    return rank(left.prefix) - rank(right.prefix)
}

function getWorkspacePackageJsonPaths (): string[] {
    const paths = [path.join(CONDO_ROOT, 'package.json')]
    const workspaceRoots = ['apps', 'packages']

    for (const workspaceRoot of workspaceRoots) {
        const absoluteRoot = path.join(CONDO_ROOT, workspaceRoot)
        if (!fs.existsSync(absoluteRoot)) continue

        const entries = fs.readdirSync(absoluteRoot, { withFileTypes: true })
        for (const entry of entries) {
            if (!entry.isDirectory()) continue
            const packageJsonPath = path.join(absoluteRoot, entry.name, 'package.json')
            if (fs.existsSync(packageJsonPath)) {
                paths.push(packageJsonPath)
            }
        }
    }

    return paths
}

function isResolvedInYarnLock (yarnLockContent: string, depName: string, rawRange: string): boolean {
    return yarnLockContent.includes(`${depName}@npm:${rawRange}`)
}

function getNewestKnownVersionForDep (depName: string, yarnLockContent: string): ParsedVersion | null {
    const packageJsonPaths = getWorkspacePackageJsonPaths()
    let newestVersion: ParsedVersion | null = null

    for (const packageJsonPath of packageJsonPaths) {
        const packageJson = fs.readJSONSync(packageJsonPath) as PackageJson
        const candidateValue = packageJson.dependencies?.[depName] ?? packageJson.devDependencies?.[depName]
        if (typeof candidateValue !== 'string') continue

        const parsedCandidate = parseVersionRange(candidateValue)
        if (!parsedCandidate) continue

        if (!isResolvedInYarnLock(yarnLockContent, depName, parsedCandidate.raw)) continue

        if (!newestVersion || compareParsedVersions(parsedCandidate, newestVersion) > 0) {
            newestVersion = parsedCandidate
        }
    }

    return newestVersion
}

async function shouldAcceptMajorUpdate (
    depName: string,
    current: ParsedVersion,
    candidate: ParsedVersion,
): Promise<boolean> {
    if (!process.stdout.isTTY) {
        logger.warn(`Skipping major update for ${depName}: non-interactive terminal`)
        return false
    }

    const answer = await p.confirm({
        message: `Major version update detected for "${depName}": ${current.raw} -> ${candidate.raw}. Apply update?`,
        initialValue: false,
    })

    if (p.isCancel(answer)) return false

    return Boolean(answer)
}

export async function refreshDepsManifest (): Promise<DepsManifest> {
    const currentManifest = readDepsManifest()
    const nextManifest: DepsManifest = { ...currentManifest }
    const yarnLockContent = fs.existsSync(YARN_LOCK_PATH) ? fs.readFileSync(YARN_LOCK_PATH, 'utf-8') : ''

    for (const [depName, currentVersionRange] of Object.entries(currentManifest)) {
        const currentVersion = parseVersionRange(currentVersionRange)
        const newestVersion = getNewestKnownVersionForDep(depName, yarnLockContent)

        if (!currentVersion || !newestVersion) continue

        if (compareParsedVersions(newestVersion, currentVersion) <= 0) continue

        const isMajorBump = newestVersion.version.major > currentVersion.version.major
        if (isMajorBump) {
            const accepted = await shouldAcceptMajorUpdate(depName, currentVersion, newestVersion)
            if (!accepted) continue
        }

        nextManifest[depName] = newestVersion.raw
    }

    writeDepsManifest(nextManifest)

    return nextManifest
}

export function applyDepsManifestToPackageJson (projectDir: string, depsManifest: DepsManifest) {
    const packageJsonPath = resolvePathInside(projectDir, 'package.json')
    const packageJson = fs.readJSONSync(packageJsonPath) as PackageJson

    const sections: Array<'dependencies' | 'devDependencies'> = ['dependencies', 'devDependencies']
    for (const section of sections) {
        const dependencies = packageJson[section]
        if (!dependencies) continue

        for (const [depName, versionRange] of Object.entries(dependencies)) {
            if (versionRange !== '0.0.0') continue

            const nextVersionRange = depsManifest[depName]
            if (!nextVersionRange) {
                throw new Error(`Missing "${depName}" in deps manifest (${DEPS_MANIFEST_PATH})`)
            }

            dependencies[depName] = nextVersionRange
        }
    }

    fs.writeJSONSync(packageJsonPath, packageJson, { spaces: 2 })
}
