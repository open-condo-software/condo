import { DEFAULT_APP_NAME } from '../consts.js'
import { getUserPkgManager } from '../utils/getUserPkgManager.js'
import { logger } from '../utils/logger.js'

// This logs the next steps that the user should take in order to advance the project
export const logNextSteps = async ({
    projectName = DEFAULT_APP_NAME,
    noInstall,
    hasCiTests = false,
}: {
    projectName: string
    noInstall: boolean
    hasCiTests?: boolean
}) => {
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

    if (hasCiTests) {
        logger.info('')
        logger.info('CI notes:')
        logger.info('  We added a basic paths-filter rule: apps/<app>/**')
        logger.info('  Please extend nodejs.condo.ci.yml filters with relevant packages/domains for your app.')
        logger.info('')
        logger.info('  CI test job may also need extra prepare flow steps for your app (for example additional dependent apps).')
        logger.info('  Please extend werf.yaml in shell/setup block to add the steps you need.')
    }

    logger.info('GIT next steps to add your miniapp as a submodule:')
    logger.info(`  cd apps/${projectName}`)
    logger.info('  git init')
    logger.info('  git remote add origin <your repo url>')
    logger.info('  git add .')
    logger.info('  git commit -m "initial scaffold"')
    logger.info('  git push -u origin HEAD')
    logger.info('  cd ../..')
    logger.info(`  git submodule add <your repo url> apps/${projectName}`)
    logger.info(`  git submodule absorbgitdirs apps/${projectName}`)
}
