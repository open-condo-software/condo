import { DEFAULT_APP_NAME } from '@cli/consts.js'
import { type InstallerOptions } from '@cli/installers/index.js'
import { getUserPkgManager } from '@cli/utils/getUserPkgManager.js'
import { logger } from '@cli/utils/logger.js'

// This logs the next steps that the user should take in order to advance the project
export const logNextSteps = async ({
    projectName = DEFAULT_APP_NAME,
    noInstall,
}: Pick<
InstallerOptions,
'projectName' | 'packages' | 'noInstall' | 'projectDir'
>) => {
    const pkgManager = getUserPkgManager()

    logger.info('Next steps:')
    if (projectName !== '.') {
        logger.info(`  cd ${projectName}`)
    }
    if (noInstall) {
    // To reflect yarn's default behavior of installing packages when no additional args provided
        if (pkgManager === 'yarn') {
            logger.info(`  ${pkgManager}`)
        } else {
            logger.info(`  ${pkgManager} install`)
        }
    }

    if (['npm', 'bun'].includes(pkgManager)) {
        logger.info(`  ${pkgManager} run dev`)
    } else {
        logger.info(`  ${pkgManager} dev`)
    }
}
