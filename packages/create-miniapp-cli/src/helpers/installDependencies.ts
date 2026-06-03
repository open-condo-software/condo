import chalk from 'chalk'
import execa from 'execa'
import ora from 'ora'

import {
    getUserPkgManager,
    type PackageManager,
} from '../utils/getUserPkgManager.js'
import { logger } from '../utils/logger.js'


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
    } catch (err: unknown) {
        spinner.fail(chalk.red('Failed to install dependencies.'))

        if (err && typeof err === 'object' && 'stdout' in err) {
            logger.error(`\n[stdout]\n${String(err.stdout)}`)
        }
        if (err && typeof err === 'object' && 'stderr' in err) {
            logger.error(`\n[stderr]\n${String(err.stderr)}`)
        }
        if (err instanceof Error) {
            logger.error(`\n[error]\n${err.message}`)
        } else {
            logger.error(`\n[error]\n${String(err)}`)
        }

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
