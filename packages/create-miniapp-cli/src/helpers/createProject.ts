import path from 'path'

import { scaffoldProject } from './scaffoldProject.js'

import { AppType, ClientAuthType } from '../consts.js'
import { PkgInstallerMap } from '../installers/index.js'
import { getUserPkgManager } from '../utils/getUserPkgManager.js'


interface CreateProjectOptions {
    projectName: string
    scopedAppName: string
    noInstall: boolean
    importAlias: string
    appType: AppType
    clientAuthType: ClientAuthType
    hasWorker: boolean
    hasOidc: boolean
    hasSchemaStitching: boolean
    hasCiTests: boolean
    packages?: PkgInstallerMap
}

export const createProject = async ({
    projectName,
    scopedAppName,
    noInstall,
    appType,
    clientAuthType,
    hasWorker,
    hasOidc,
    hasSchemaStitching,
    hasCiTests,
}: CreateProjectOptions) => {
    const pkgManager = getUserPkgManager()
    const rootDir = path.resolve(process.cwd(), '../..') // relative to CLI package
    const appsDir = path.join(rootDir, 'apps')
    const projectDir = path.resolve(appsDir, projectName)

    // Bootstraps the base application
    await scaffoldProject({
        projectName,
        projectDir,
        pkgManager,
        scopedAppName,
        noInstall,
        appType,
        clientAuthType,
        hasWorker,
        hasOidc,
        hasSchemaStitching,
        hasCiTests,
    })

    return projectDir
}
