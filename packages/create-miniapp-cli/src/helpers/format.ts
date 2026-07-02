import chalk from 'chalk'
import execa from 'execa'
import ora from 'ora'

import { type PackageManager } from '../utils/getUserPkgManager.js'
import { logger } from '../utils/logger.js'


// Runs format and lint command to ensure created repository is tidy upon creation
export const formatProject = async ({
    pkgManager,
    projectDir,
}: {
    pkgManager: PackageManager
    projectDir: string
}) => {
    logger.info(`Formatting project with ${'prettier'}...`)
    const spinner = ora('Running format command\n').start()

    await execa(pkgManager, ['run', 'format:write'], {
        cwd: projectDir,
    })

    spinner.succeed(`${chalk.green('Successfully formatted project')}`)
}
