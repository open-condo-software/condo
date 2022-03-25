import React from 'react'
import { BillingIntegration, BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { DescriptionBlock } from '@condo/domains/miniapp/utils/clientSchema'
import get from 'lodash/get'
import { useOrganization } from '@core/next/organization'
import { AppDescriptionPageContent } from './AppDescriptionPageContent'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useIntl } from '@core/next/intl'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'
import Error from 'next/error'
import Head from 'next/head'
import { PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { BILLING_APP_TYPE } from '@condo/domains/miniapp/constants'

interface AboutBillingServicePageProps {
    id: string,
}

export const AboutBillingServicePage: React.FC<AboutBillingServicePageProps> = ({ id }) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const BillingMessage = intl.formatMessage({ id: 'menu.Billing' })
    const TagMessage = intl.formatMessage({ id: `services.category.${BILLING_APP_TYPE}` })

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)

    const { obj: integration, loading: integrationLoading, error: integrationError } = BillingIntegration.useObject({
        where: { id },
    })

    const { obj: context, loading: contextLoading, error: contextError } = BillingIntegrationOrganizationContext.useObject({
        where: { organization: { id: organizationId } },
    })

    const { objs: blocks, loading: blocksLoading, error: blocksError } = DescriptionBlock.useObjects({
        where: {
            billingIntegration: { id: get(integration, 'id', null) },
            acquiringIntegration_is_null: true,
        },
    })

    if (integrationLoading || contextLoading || integrationError || contextError || blocksLoading || blocksError) {
        return (
            <LoadingOrErrorPage title={LoadingMessage} error={integrationError || contextError || blocksError} loading={integrationLoading || contextLoading || blocksLoading}/>
        )
    }

    if (!integration) {
        return <Error statusCode={404}/>
    }

    const PageTitle = get(integration, 'name', BillingMessage)

    const descriptionBlocks = blocks.map(block => ({
        title: block.title,
        description: block.description,
        imageSrc: block.image.publicUrl,
    }))

    return (
        <FeatureFlagRequired name={'services'} fallback={<Error statusCode={404}/>}>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <AppDescriptionPageContent
                        title={integration.name}
                        description={integration.shortDescription}
                        published={integration.createdAt}
                        logoSrc={get(integration, ['logo', 'publicUrl'])}
                        tag={TagMessage}
                        developer={integration.developer}
                        partnerUrl={get(integration, 'partnerUrl')}
                        descriptionBlocks={descriptionBlocks}
                        instruction={integration.instruction}
                        appUrl={integration.appUrl}
                    />
                </PageContent>
            </PageWrapper>
        </FeatureFlagRequired>
    )
}