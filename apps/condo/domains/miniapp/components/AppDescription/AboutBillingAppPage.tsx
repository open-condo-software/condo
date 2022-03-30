import React, { useEffect } from 'react'
import { BillingIntegration, BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import get from 'lodash/get'
import { useOrganization } from '@core/next/organization'
import { AppDescriptionPageContent } from './AppDescriptionPageContent'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useIntl } from '@core/next/intl'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'
import Error from 'next/error'
import Head from 'next/head'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { BILLING_APP_TYPE } from '@condo/domains/miniapp/constants'
import { ConnectedBilling } from '@condo/domains/billing/components/Alerts/ConnectedBilling'
import { useRouter } from 'next/router'

interface AboutBillingAppPageProps {
    id: string,
}

export const AboutBillingAppPage: React.FC<AboutBillingAppPageProps> = ({ id }) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const BillingMessage = intl.formatMessage({ id: 'menu.Billing' })
    const TagMessage = intl.formatMessage({ id: `services.category.${BILLING_APP_TYPE}` })

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)

    const router = useRouter()

    const { obj: integration, loading: integrationLoading, error: integrationError } = BillingIntegration.useObject({
        where: { id },
    })

    const { objs: contexts, loading: contextsLoading, error: contextsError } = BillingIntegrationOrganizationContext.useObjects({
        where: { organization: { id: organizationId } },
    })

    // NOTE: Page visiting is valid if:
    // Billing context not exist
    // If context exist -> redirect to app index page
    useEffect(() => {
        if (integration && !contextsLoading && !contextsError && contexts) {
            if (contexts.some((context) => get(context, ['integration', 'id']) === integration.id)) {
                router.push(`/miniapps/${id}?type=${BILLING_APP_TYPE}`)
            }
        }
    }, [router, integration, contextsLoading, contextsError, contexts, id])

    if (integrationLoading || contextsLoading || integrationError || contextsError) {
        return (
            <LoadingOrErrorPage title={LoadingMessage} error={integrationError || contextsError} loading={integrationLoading || contextsLoading}/>
        )
    }

    if (!integration) {
        return <Error statusCode={404}/>
    }

    const PageTitle = get(integration, 'name', BillingMessage)

    const aboutSections = get(integration, ['about', '0', 'props', 'sections'], [])

    const isAnyBillingConnected = Boolean(contexts.length)

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
                        aboutSections={aboutSections}
                        instruction={integration.instruction}
                        appUrl={integration.appUrl}
                        disabledConnect={isAnyBillingConnected}
                    >
                        {
                            isAnyBillingConnected && (
                                <ConnectedBilling/>
                            )
                        }
                    </AppDescriptionPageContent>
                </PageContent>
            </PageWrapper>
        </FeatureFlagRequired>
    )
}