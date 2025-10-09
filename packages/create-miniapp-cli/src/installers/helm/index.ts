import { updateReviewSecrets } from '@cli/installers/helm/reviewSecrets'
import { updateSecretValues } from '@cli/installers/helm/secretValues'
import { updateServicesUrls } from '@cli/installers/helm/servicesUrls'
import { writeHelmTemplates } from '@cli/installers/helm/templates'
import { getNextPrefix } from '@cli/installers/helm/utils'
import { logger } from '@cli/utils/logger'

interface SetupHelmProps {
    appName: string
    wantReview: boolean
}

export async function setupHelm ({ appName, wantReview }: SetupHelmProps) {
    const nextPrefix = await getNextPrefix()
    logger.info(`Next prefix block: ${nextPrefix}`)

    const created = await writeHelmTemplates(appName, nextPrefix, wantReview)
    const servicesFile = await updateServicesUrls(appName)
    
    created.push(servicesFile)

    if (wantReview) {
        const reviewFile = await updateReviewSecrets(appName)
        if (reviewFile) created.push(reviewFile)
    }

    const secretValuesFile = await updateSecretValues(appName, wantReview)
    if (secretValuesFile) {
        created.push(secretValuesFile)
    }

    logger.success('Helm setup completed! Created/modified files:\n' + created.join('\n'))
}