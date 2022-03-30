import React from 'react'
import { AcquiringIntegration } from '@condo/domains/acquiring/utils/clientSchema'
import { BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import get from 'lodash/get'
import { useOrganization } from '@core/next/organization'
import { AppDescriptionPageContent } from './AppDescriptionPageContent'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useIntl } from '@core/next/intl'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'
import Error from 'next/error'
import Head from 'next/head'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { ACQUIRING_APP_TYPE } from '@condo/domains/miniapp/constants'
import { NoConnectedBillings } from '@condo/domains/acquiring/components/Alerts/NoConnectedBillings'

interface AboutAcquiringAppPageProps {
    id: string,
}

export const AboutAcquiringAppPage: React.FC<AboutAcquiringAppPageProps> = ({ id }) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const AcquiringMessage = intl.formatMessage({ id: `services.category.${ACQUIRING_APP_TYPE}` })

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)

    const { obj: integration, loading: integrationLoading, error: integrationError } = AcquiringIntegration.useObject({
        where: { id },
    })

    const { objs: billingContexts, loading: billingsLoading, error: billingsError } = BillingIntegrationOrganizationContext.useObjects({
        where: { organization: { id: organizationId } },
    })

    if (integrationLoading || billingsLoading || integrationError || billingsError) {
        return (
            <LoadingOrErrorPage
                title={LoadingMessage}
                error={integrationError || billingsError}
                loading={integrationLoading || billingsLoading}
            />
        )
    }

    if (!integration) {
        return <Error statusCode={404}/>
    }

    const PageTitle = get(integration, 'name', AcquiringMessage)

    const aboutSections = get(integration, ['about', '0', 'props', 'sections'], [])

    const isAnyBillingConnected = Boolean(billingContexts.length)

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
                        tag={AcquiringMessage}
                        developer={integration.developer}
                        partnerUrl={get(integration, 'partnerUrl')}
                        aboutSections={aboutSections}
                        instruction={integration.instruction}
                        appUrl={integration.appUrl}
                        disabledConnect={!isAnyBillingConnected}
                    >
                        {
                            !isAnyBillingConnected && (
                                <NoConnectedBillings/>
                            )
                        }
                    </AppDescriptionPageContent>
                </PageContent>
            </PageWrapper>
        </FeatureFlagRequired>
    )
}