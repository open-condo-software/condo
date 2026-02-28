import { promises as fs } from 'fs'
import path from 'path'

import { CONDO_ROOT, ENVS_TYPE } from '@cli/consts'
import { logger } from '@cli/utils/logger'
import ora from 'ora'

const GITMODULES_PATH = path.resolve(CONDO_ROOT, './.gitmodules')
const WORKFLOWS_DIR = path.resolve(CONDO_ROOT, './.github/workflows')


const ENV_CONFIG = {
    prod: {
        filename: 'deploy_production.yaml',
        domainSuffix: '.doma.ai',
        envVarPrefix: 'WERF_SET_CI_',
    },
    dev: {
        filename: 'deploy_development.yaml',
        domainSuffix: '.d.doma.ai',
        envVarPrefix: 'WERF_SET_CI_',
    },
    review: {
        filename: 'deploy_review.yaml',
        domainSuffix: '.r.doma.ai',
        envVarPrefix: 'WERF_SET_CI_',
    },
} as const

export async function addSubmoduleEntry (appName: string) {
    const spinner = ora('Adding submodule entry to .gitmodules...').start()
    const content = await fs.readFile(GITMODULES_PATH, 'utf8')
    const submoduleEntry = `[submodule "apps/${appName}"]\n\tpath = apps/${appName}\n\turl = git@github.com:open-condo-software/condo-${appName}.git`
    const trimmedContent = content.trimEnd()
    const out = trimmedContent + (trimmedContent ? '\n' : '') + submoduleEntry + '\n'

    await fs.writeFile(GITMODULES_PATH, out, 'utf8')
    
    spinner.succeed('Adding submodule completed!')
}

export async function addDeployEnvVar (appName: string, env: ENVS_TYPE) {
    const spinner = ora('Adding deploy CI variables for ${env} environment to ./.github/workflows...').start()

    try {
        const config = ENV_CONFIG[env]
        const workflowPath = path.join(WORKFLOWS_DIR, config.filename)
  
        const content = await fs.readFile(workflowPath, 'utf8')
        const underscoredAppName = appName.replace(/-/g, '_').toUpperCase()
        const envVarName = `${config.envVarPrefix}${underscoredAppName}_URL`
  
        if (content.includes(`${envVarName}:`)) {
            console.log(`Environment variable ${envVarName} already exists in ${config.filename}`)
            return workflowPath
        }

        let envVarValue: string
        const ciVarName = `ci_${appName.replace(/-/g, '_')}_url`
  
        if (env === 'review') {
            envVarValue = `"global.${ciVarName}=review-$\{{ env.REVIEW_URL_PREFIX }}-${appName}${config.domainSuffix}"`
        } else {
            envVarValue = `"global.${ciVarName}=${appName}${config.domainSuffix}"`
        }
  
        const newLine = `          ${envVarName}: ${envVarValue}`
  
        // Find the line with WERF_SET_CI_NAMESPACE
        const lines = content.split('\n')
        const namespaceLineIndex = lines.findIndex(line => line.includes('WERF_SET_CI_NAMESPACE:'))
  
        if (namespaceLineIndex === -1) {
            logger.error(`Github workflow for ${env} failed! You should add the CI variable manually`)
            return
        }
  
        // Insert the new line before the namespace line
        lines.splice(namespaceLineIndex, 0, newLine)
        const out = lines.join('\n')
        await fs.writeFile(workflowPath, out, 'utf8')
        spinner.succeed(`Adding deploy CI variables for ${env} environment completed!`)
    
    } catch (error) {
        spinner.fail(`Adding deploy CI variables for ${env} environment failed! You should add them manually! Error: ${error}`)
    }
}