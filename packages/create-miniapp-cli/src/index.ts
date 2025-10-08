#!/usr/bin/env node
import * as path from 'path'

import { runCli } from '@cli/runCli.js'
import { execa } from 'execa'
import fs from 'fs-extra'
import { type PackageJson } from 'type-fest'

import { createProject } from './helpers/createProject.js'
import { installDependencies } from './helpers/installDependencies.js'
import { logNextSteps } from './helpers/logNextSteps.js'
import { setImportAlias } from './helpers/setImportAlias.js'
import { setupHelm } from './installers/helm.js'
import { buildPkgInstallerMap } from './installers/index.js'
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
        packages,
        flags: { noInstall, importAlias, appType },
    } = await runCli()


    let usePackages
    if (packages) {
        usePackages = buildPkgInstallerMap(packages)
    }

    // e.g. dir/@mono/app returns ["@mono/app", "dir/app"]
    const [scopedAppName, appDir] = parseNameAndPath(appName)

    const projectDir = await createProject({
        projectName: appDir,
        scopedAppName,
        packages: usePackages,
        importAlias,
        noInstall,
        appType,
    })

    // Write name to package.json
    const pkgJson = fs.readJSONSync(
        path.join(projectDir, 'package.json'),
    ) as PackageJson
    pkgJson.name = `@app/${scopedAppName}`


    // ? Bun doesn't support this field (yet)
    if (pkgManager !== 'bun') {
        const { stdout } = await execa(pkgManager, ['-v'], {
            cwd: projectDir,
        })
        pkgJson.packageManager = `${pkgManager}@${stdout.trim()}`
    }

    fs.writeJSONSync(path.join(projectDir, 'package.json'), pkgJson, {
        spaces: 2,
    })
    // update import alias in any generated files if not using the default
    if (importAlias !== '~/') {
        setImportAlias(projectDir, importAlias, appName)
    }

    if (!noInstall) {
        await installDependencies({ projectDir })

        // await formatProject({
        //     pkgManager,
        //     projectDir,
        // })
    }

    // run prepare and yarn scripts
    await prepareApp({ appName, pkgManager, projectDir })

    // TODO: take 'wantReview' flag from CLI
    await setupHelm({ appName, wantReview: true })


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
            'An unknown error has occurred. Please open an issue on github with the below:',
        )
        console.log(err)
    }
    process.exit(1)
})
