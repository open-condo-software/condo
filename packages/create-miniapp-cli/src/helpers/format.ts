import { type PackageManager } from '@cli/utils/getUserPkgManager.js'
import { logger } from '@cli/utils/logger.js'
import chalk from 'chalk'
import { execa } from 'execa'
import ora from 'ora'


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
