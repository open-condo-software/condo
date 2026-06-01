import { AppType } from '../../consts.js'
import { updateReviewSecrets } from './reviewSecrets.js'
import { updateSecretValues } from './secretValues.js'
import { updateServicesUrls } from './servicesUrls.js'
import { writeHelmTemplates } from './templates.js'
import { getNextPrefix } from './utils.js'
import { MaxOldSpace, ResourceSettings, updateValues } from './values.js'
import { logger } from '../../utils/logger.js'
import ora from 'ora'

interface SetupHelmProps {
    appName: string
    appType: AppType
    hasReview: boolean
    appResources: ResourceSettings
    maxOldSpace: MaxOldSpace
    workerResources?: ResourceSettings
    hasWorker: boolean
}

export async function setupHelm ({ appName, appType, hasReview, appResources, workerResources, hasWorker, maxOldSpace }: SetupHelmProps) {
    const spinner = ora('Setting up Helm...').start()
    try {
        const nextPrefix = await getNextPrefix()
        logger.info(`Next prefix block: ${nextPrefix}`)

        const created = await writeHelmTemplates(appName, nextPrefix, hasReview, hasWorker, appType)
        const servicesFile = await updateServicesUrls(appName)
        created.push(servicesFile)

        if (hasReview) {
            const reviewFile = await updateReviewSecrets(appName)
            if (reviewFile) created.push(reviewFile)
        }

        const secretValuesFile = await updateSecretValues(appName, hasReview)
        if (secretValuesFile) created.push(secretValuesFile)

        const valuesFile = await updateValues({ appName, appResources, workerResources, hasReview, hasWorker, maxOldSpace })
        if (valuesFile) created.push(valuesFile)

        spinner.succeed('Helm setup completed!')
    } catch (err: any) {
        spinner.fail('Helm setup failed!')

        console.error('\n[error]')
        if (err.stack) {
            console.error(err.stack)
        } else {
            console.error(err.message || err)
        }

        throw err
    }
}
