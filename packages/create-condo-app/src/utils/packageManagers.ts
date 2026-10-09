import { getConfig, PackageManager } from './config'
import { getMonorepoInfo } from './repos'


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

export async function install () {
    const { packageManager, projectPath } = getConfig()
    console.log(packageManager, projectPath)
}
