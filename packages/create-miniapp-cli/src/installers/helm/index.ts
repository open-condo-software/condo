import { updateReviewSecrets } from '@cli/installers/helm/reviewSecrets'
import { updateSecretValues } from '@cli/installers/helm/secretValues'
import { updateServicesUrls } from '@cli/installers/helm/servicesUrls'
import { writeHelmTemplates } from '@cli/installers/helm/templates'
import { getNextPrefix } from '@cli/installers/helm/utils'
import { MaxOldSpace, ResourceSettings, updateValues } from '@cli/installers/helm/values'
import { logger } from '@cli/utils/logger'

interface SetupHelmProps {
    appName: string
    hasReview: boolean
    appResources: ResourceSettings
    maxOldSpace: MaxOldSpace
    workerResources?: ResourceSettings
    hasWorker: boolean
}

export async function setupHelm ({ appName, hasReview, appResources, workerResources, hasWorker, maxOldSpace }: SetupHelmProps) {
    const nextPrefix = await getNextPrefix()
    logger.info(`Next prefix block: ${nextPrefix}`)

    const created = await writeHelmTemplates(appName, nextPrefix, hasReview)
    const servicesFile = await updateServicesUrls(appName)

    created.push(servicesFile)

    if (hasReview) {
        const reviewFile = await updateReviewSecrets(appName)
        if (reviewFile) created.push(reviewFile)
    }

    const secretValuesFile = await updateSecretValues(appName, hasReview)
    if (secretValuesFile) {
        created.push(secretValuesFile)
    }

    // const valuesFile = await updateValues({ appName, appResources, workerResources, hasReview, hasWorker, maxOldSpace })
    // if (valuesFile) {
    //     created.push(valuesFile)
    // }

    logger.success('Helm setup completed! Created/modified files:\n' + created.join('\n'))
}