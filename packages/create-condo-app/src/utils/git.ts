import { execSync } from 'child_process'
import { rmSync } from 'fs'
import { join } from 'path'

import { getConfig } from './config'

function isInGitRepository (): boolean {
    try {
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
        return true
    } catch (_) {
        // No empty
    }
    return false
}

function isDefaultBranchSet (): boolean {
    try {
        execSync('git config init.defaultBranch', { stdio: 'ignore' })
        return true
    } catch (_) {
        // No empty
    }
    return false
}

export function tryGitInit () {
    let wasInitialized = false
    const { projectPath } = getConfig()

    try {
        execSync('git --version', { stdio: 'ignore', cwd: projectPath })
        if (isInGitRepository()) {
            return false
        }

        execSync('git init', { stdio: 'ignore' })
        wasInitialized = true

        if (!isDefaultBranchSet()) {
            execSync('git checkout -b main', { stdio: 'ignore' })
        }

        execSync('git add -A', { stdio: 'ignore' })
        execSync('git commit -m "feat: initial commit from Create Condo App"', {
            stdio: 'ignore',
        })
        return true
    } catch (e) {
        if (wasInitialized) {
            try {
                rmSync(join(projectPath, '.git'), { recursive: true, force: true })
            } catch (_) {
                // No empty
            }
        }

        return false
    }
}