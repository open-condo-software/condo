import { getMonorepoInfo } from './repos'

import type { PackageManager } from './config'

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
