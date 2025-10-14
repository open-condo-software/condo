import {
    getUserPkgManager,
    type PackageManager,
} from '@cli/utils/getUserPkgManager.js'
import { logger } from '@cli/utils/logger'
import chalk from 'chalk'
import { execa } from 'execa'
import ora from 'ora'


const runInstallCommand = async (
    pkgManager: PackageManager,
    projectDir: string,
): Promise<boolean> => {
    const spinner = ora({
        text: `Installing dependencies with ${pkgManager}...`,
    }).start()

    try {
        // Run silently and capture output
        await execa(pkgManager, ['install'], {
            cwd: projectDir,
            stdio: 'pipe',
        })

        spinner.succeed(chalk.green('Successfully installed dependencies!\n'))
        return true
    } catch (err: any) {
        spinner.fail(chalk.red('Failed to install dependencies.'))

        if (err.stdout) logger.error(`\n[stdout]\n${err.stdout}`)
        if (err.stderr) logger.error(`\n[stderr]\n${err.stderr}`)
        logger.error(`\n[error]\n${err.message}`)

        return false
    }
}

export const installDependencies = async ({
    projectDir,
}: {
    projectDir: string
}) => {
    const pkgManager = getUserPkgManager()

    await runInstallCommand(pkgManager, projectDir)
}
