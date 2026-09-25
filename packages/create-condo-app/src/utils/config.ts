export type PackageManager = 'npm' | 'yarn' | 'pnpm'

type Config = {
    appName: string
    projectPath: string
    packageManager: PackageManager
    preferences: Record<string, string | boolean>
}

let config: Config = {
    appName: '',
    projectPath: process.cwd(),
    packageManager: 'npm',
    preferences: {},
}

export function setConfig (updatedConfig: Partial<Config>) {
    config = { ...config, ...updatedConfig }
}

export function getConfig (): Config {
    return config
}