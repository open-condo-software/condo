import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

import execa from 'execa'

import { getConfig, PackageManager } from './config'
import { getMonorepoInfo } from './repos'

const NPM_RUN_ALIASES: Record<PackageManager, string> = {
    yarn: 'yarn',
    pnpm: 'pnpm',
    npm: 'npm run',
}

export async function exec (command: string, args?: Array<string>) {
    const { packageManager, projectPath } = getConfig()
    const resolvedArgs = args ?? []
    return await execa(packageManager, ['exec', command, '--', ...resolvedArgs], {
        cwd: projectPath,
        stdio: 'inherit',
        env: { ...process.env },
    })
}

export async function runScript (scriptName: string) {
    const { packageManager, projectPath } = getConfig()

    return await execa(packageManager, ['run', scriptName], {
        cwd: projectPath,
        stdio: 'inherit',
        env: { ...process.env },
    })
}

export function getPackageManager (): PackageManager {
    const { isMonorepo, packageManager } = getMonorepoInfo()

    // If we found a package manager during traversal, use it
    if (isMonorepo && packageManager) {
        return packageManager
    }

    // Fallback: check environment variables
    const userAgent = process.env.npm_config_user_agent || ''
    if (userAgent.startsWith('yarn')) return 'yarn'
    if (userAgent.startsWith('pnpm')) return 'pnpm'
    if (userAgent.startsWith('npm')) return 'npm'

    // Final fallback: default to npm
    return 'npm'
}

export function adjustScripts (): Array<string> {
    const { packageManager, projectPath } = getConfig()
    if (!existsSync(join(projectPath, 'package.json'))) return []

    const packageJson = JSON.parse(readFileSync(join(projectPath, 'package.json'), 'utf-8'))
    if (!packageJson.scripts) return []

    const scripts = packageJson.scripts as Record<string, string>

    packageJson.scripts = Object.fromEntries(Object.entries(scripts).map(([scriptName, command]) => [scriptName, command.replace('npm run', NPM_RUN_ALIASES[packageManager])]))
    writeFileSync(join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2))

    return Object.keys(scripts)
}

export async function install () {
    const { packageManager, projectPath } = getConfig()
    const args = ['install']

    await execa(packageManager, args, {
        cwd: projectPath,
        stdio: 'inherit',
        env: {
            ...process.env,
            ADBLOCK: '1',
            // we set NODE_ENV to development as pnpm skips dev
            // dependencies when production
            NODE_ENV: 'development',
            DISABLE_OPENCOLLECTIVE: '1',
        },
    })
}
