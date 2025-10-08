import { AppType } from '@cli/consts.js'
import { PackageManager } from '@cli/utils/getUserPkgManager.js'

import { dynamicEslintInstaller } from './eslint.js'

export const availablePackages = ['eslint'] as const
export type AvailablePackages = (typeof availablePackages)[number]

export const databaseProviders = [
    'mysql',
    'postgres',
    'sqlite',
    'planetscale',
] as const
export type DatabaseProvider = (typeof databaseProviders)[number]

export interface InstallerOptions {
    projectDir: string
    pkgManager: PackageManager
    noInstall: boolean
    packages?: PkgInstallerMap
    appRouter?: boolean
    projectName: string
    scopedAppName: string
    appType: AppType
}

export type Installer = (opts: InstallerOptions) => void

export type PkgInstallerMap = Record<
AvailablePackages,
{
    inUse: boolean
    installer: Installer
}
>

export const buildPkgInstallerMap = (
    packages: AvailablePackages[],
): PkgInstallerMap => ({
    eslint: {
        inUse: packages.includes('eslint'),
        installer: dynamicEslintInstaller,
    },
})
