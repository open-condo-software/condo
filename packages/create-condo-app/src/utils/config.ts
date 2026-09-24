export type PackageManager = 'npm' | 'yarn' | 'pnpm'

type Config = {
    appName: string
    projectPath: string
    packageManager: PackageManager
}

let config: Config = {
    appName: '',
    projectPath: process.cwd(),
    packageManager: 'npm',
}

export function setConfig (updatedConfig: Partial<Config>) {
    config = { ...config, ...updatedConfig }
}

export function getConfig (): Config {
    return config
}