import path from 'path'

import * as p from '@clack/prompts'
import { APP_TYPES, AppType, PKG_ROOT } from '@cli/consts.js'
import { InstallerOptions } from '@cli/installers/index.js'
import { logger } from '@cli/utils/logger.js'
import chalk from 'chalk'
import fs from 'fs-extra'
import ora from 'ora'


function getTemplateBaseDir (appType: AppType) {
    if (appType === APP_TYPES.client) {
        return path.join(PKG_ROOT, 'template/client')
    } else if (appType === APP_TYPES.server) {
        return path.join(PKG_ROOT, 'template/server')
    }

    return path.join(PKG_ROOT, 'template/fullstack')
}

// This bootstraps the base application based on user's choice of AppType(server | client | full-stack)
export const scaffoldProject = async ({
    projectName,
    projectDir,
    pkgManager,
    noInstall,
    appType,
}: InstallerOptions) => {
    const srcDir = getTemplateBaseDir(appType)

    if (!noInstall) {
        logger.info(`\nUsing: ${chalk.cyan.bold(pkgManager)}\n`)
    }

    const spinner = ora(`Scaffolding in: ${projectDir}...\n`).start()

    if (fs.existsSync(projectDir)) {
        if (fs.readdirSync(projectDir).length === 0) {
            if (projectName !== '.')
                spinner.info(
                    `${chalk.cyan.bold(projectName)} exists but is empty, continuing...\n`,
                )
        } else {
            spinner.stopAndPersist()
            const overwriteDir = await p.select({
                message: `${chalk.redBright.bold('Warning:')} ${chalk.cyan.bold(
                    projectName,
                )} already exists and isn't empty. How would you like to proceed?`,
                options: [
                    {
                        label: 'Abort installation (recommended)',
                        value: 'abort',
                    },
                    {
                        label: 'Clear the directory and continue installation',
                        value: 'clear',
                    },
                    {
                        label: 'Continue installation and overwrite conflicting files',
                        value: 'overwrite',
                    },
                ],
                initialValue: 'abort',
            })

            if (p.isCancel(overwriteDir) || overwriteDir === 'abort') {
                spinner.fail('Aborting installation...')
                process.exit(1)
            }

            const confirmOverwriteDir = await p.confirm({
                message: `Are you sure you want to ${
                    overwriteDir === 'clear'
                        ? 'clear the directory'
                        : 'overwrite conflicting files'
                }?`,
                initialValue: false,
            })

            if (p.isCancel(confirmOverwriteDir) || !confirmOverwriteDir) {
                spinner.fail('Aborting installation...')
                process.exit(1)
            }

            if (overwriteDir === 'clear') {
                spinner.info(
                    `Emptying ${chalk.cyan.bold(projectName)} and creating miniapp..\n`,
                )
                fs.emptyDirSync(projectDir)
            }
        }
    }

    spinner.start()

    fs.copySync(srcDir, projectDir)
    fs.renameSync(
        path.join(projectDir, '_gitignore'),
        path.join(projectDir, '.gitignore'),
    )

    const scaffoldedName = projectName === '.' ? 'App' : chalk.cyan.bold(projectName)

    spinner.succeed(
        `${scaffoldedName} ${chalk.green('scaffolded successfully!')}\n`,
    )
}
