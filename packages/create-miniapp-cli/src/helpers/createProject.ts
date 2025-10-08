import fs from 'fs'
import path from 'path'

import { AppType } from '@cli/consts.js'
import { PkgInstallerMap } from '@cli/installers/index.js'
import { getUserPkgManager } from '@cli/utils/getUserPkgManager.js'

import { installPackages } from './installPackages.js'
import { scaffoldProject } from './scaffoldProject.js'

interface CreateProjectOptions {
    projectName: string
    scopedAppName: string
    noInstall: boolean
    importAlias: string
    appType: AppType
    packages?: PkgInstallerMap
}

export const createProject = async ({
    projectName,
    scopedAppName,
    packages,
    noInstall,
    appType,
}: CreateProjectOptions) => {
    const pkgManager = getUserPkgManager()
    console.log('process.cwd(): ', process.cwd())
    console.log('projectName: ', projectName)
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
    })

    // Install the selected packages
    // if (packages) {
    //     installPackages({
    //         projectName,
    //         scopedAppName,
    //         projectDir,
    //         pkgManager,
    //         packages,
    //         noInstall,
    //         appType,
    //     })
    // }

    // const indexModuleCss = path.join(
    //     PKG_ROOT,
    //     'template/extras/src/index.module.css',
    // )
    // const indexModuleCssDest = path.join(
    //     projectDir,
    //     'src',
    //     'pages',
    //     'index.module.css',
    // )
    // fs.copyFileSync(indexModuleCss, indexModuleCssDest)

    return projectDir
}
