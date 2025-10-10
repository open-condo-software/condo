#!/usr/bin/env node
import * as path from 'path'

import { runCli } from '@cli/runCli.js'
import fs from 'fs-extra'
import { type PackageJson } from 'type-fest'

import { createProject } from './helpers/createProject.js'
import { installDependencies } from './helpers/installDependencies.js'
import { logNextSteps } from './helpers/logNextSteps.js'
import { replaceTextInFiles, setImportAlias } from './helpers/setImportAlias.js'
import { setupHelm } from './installers/helm'
import { prepareApp } from './installers/prepare.js'
import { getUserPkgManager } from './utils/getUserPkgManager.js'
import { logger } from './utils/logger.js'
import { parseNameAndPath } from './utils/parseNameAndPath.js'
import { renderTitle } from './utils/renderTitle.js'


const main = async () => {
    const pkgManager = getUserPkgManager()
    renderTitle()

    const {
        appName,
        flags: {
            noInstall,
            importAlias,
            appType,
            hasReview,
            hasWorker,
            appResources,
            workerResources,
            maxOldSpace,
        },
    } = await runCli()

    // e.g. dir/@mono/app returns ["@mono/app", "dir/app"]
    const [scopedAppName, appDir] = parseNameAndPath(appName)

    const projectDir = await createProject({
        projectName: appDir,
        scopedAppName,
        importAlias,
        noInstall,
        appType,
    })

    // Write name to package.json
    const pkgJson = fs.readJSONSync(
        path.join(projectDir, 'package.json'),
    ) as PackageJson
    pkgJson.name = `@app/${scopedAppName}`
    replaceTextInFiles(projectDir, '@app/template', `@app/${scopedAppName}`)

    fs.writeJSONSync(path.join(projectDir, 'package.json'), pkgJson, {
        spaces: 2,
    })
    // update import alias in any generated files if not using the default
    if (importAlias !== '~/') {
        setImportAlias(projectDir, importAlias, appName)
    } else {
        replaceTextInFiles(projectDir, '@app/~/', `@app/${scopedAppName}`)
    }

    if (!noInstall) {
        await installDependencies({ projectDir })
    }

    // run prepare and yarn scripts to make app ready for development
    await prepareApp({ appName, pkgManager, projectDir })

    // configure helm templates and values/secret-values
    await setupHelm({ appName, hasReview, appResources, hasWorker, maxOldSpace, workerResources })

    await logNextSteps({
        projectName: appDir,
        noInstall,
        projectDir,
    })

    process.exit(0)
}

main().catch((err) => {
    logger.error('Aborting installation...')
    if (err instanceof Error) {
        logger.error(err)
    } else {
        logger.error(
            'An unknown error has occurred. Please open an issue on github with the below error:',
        )
        console.log(err)
    }
    process.exit(1)
})
