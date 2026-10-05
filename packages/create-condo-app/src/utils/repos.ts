import { existsSync, readFileSync } from 'fs'
import { dirname, resolve, join } from 'path'

import { getConfig } from './config'

import type { PackageManager, MonorepoInfo } from './config'

const MAX_SEARCH_DEPTH = 5

function isCondoMonorepo (repoRootPath: string): boolean {
    const pkgJsonPath = join(repoRootPath, 'package.json')
    const condoPkgJson = join(repoRootPath, 'apps', 'condo', 'package.json')
    if (!existsSync(pkgJsonPath) || !existsSync(condoPkgJson)) return false

    try {
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
        return typeof pkgJson === 'object' &&
            pkgJson !== null &&
            typeof pkgJson.repository === 'string'
            && pkgJson.repository === 'https://github.com/open-condo-software/condo'
    } catch {
        return false
    }
}

export function getMonorepoInfo (): MonorepoInfo {
    const { projectPath } = getConfig()
    let currentDir = resolve(projectPath)
    let depth = 0

    while (depth < MAX_SEARCH_DEPTH) {
        // Check for lock files
        const hasNpmLock = existsSync(resolve(currentDir, 'package-lock.json'))
        const hasYarnLock = existsSync(resolve(currentDir, 'yarn.lock'))
        const hasPnpmLock = existsSync(resolve(currentDir, 'pnpm-lock.yaml'))

        // Check for workspace configs (monorepo indicators)
        const hasPnpmWorkspace = existsSync(resolve(currentDir, 'pnpm-workspace.yaml'))
        const hasYarnRc = existsSync(resolve(currentDir, '.yarnrc.yml'))
        const hasGit = existsSync(resolve(currentDir, '.git'))

        let packageManager: PackageManager | null = null
        if (hasNpmLock) packageManager = 'npm'
        else if (hasYarnLock) packageManager = 'yarn'
        else if (hasPnpmLock) packageManager = 'pnpm'

        const isMonorepo = hasPnpmWorkspace || hasYarnRc || hasGit

        // If we found a lock file or workspace config, return info
        if (packageManager || isMonorepo) {
            const isCondoRepo = isMonorepo ? isCondoMonorepo(currentDir) : false

            return {
                isCondoRepo,
                isMonorepo,
                packageManager,
                root: currentDir,
            }
        }

        // Stop at git root
        if (hasGit) {
            return {
                isCondoRepo: false,
                isMonorepo: true,
                packageManager: null,
                root: currentDir,
            }
        }

        // Move up one directory
        const parentDir = dirname(currentDir)
        if (parentDir === currentDir) {
            // Reached filesystem root
            break
        }
        currentDir = parentDir
        depth++
    }

    // No lock file or workspace config found
    return {
        isCondoRepo: false,
        isMonorepo: false,
        packageManager: null,
        root: projectPath,
    }
}
