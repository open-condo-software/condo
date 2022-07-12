import React, { useCallback, useEffect } from 'react'
import { BillingIntegration, BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'
import get from 'lodash/get'
import { useOrganization } from '@core/next/organization'
import { AppDescriptionPageContent } from './AppDescriptionPageContent'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useIntl } from '@core/next/intl'
import Error from 'next/error'
import Head from 'next/head'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { BILLING_APP_TYPE } from '@condo/domains/miniapp/constants'
import { AlreadyConnectedBilling } from '@condo/domains/miniapp/components/AppDescription/Alerts/AlreadyConnectedBilling'
import { NoAcquiring } from '@condo/domains/miniapp/components/AppDescription/Alerts/NoAcquiring'
import { useRouter } from 'next/router'

interface AboutBillingAppPageProps {
    id: string,
}

export const AboutBillingAppPage: React.FC<AboutBillingAppPageProps> = ({ id }) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const BillingMessage = intl.formatMessage({ id: 'menu.Billing' })
    const TagMessage = intl.formatMessage({ id: `miniapps.category.${BILLING_APP_TYPE}` })

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)

    const router = useRouter()

    const { obj: integration, loading: integrationLoading, error: integrationError } = BillingIntegration.useObject({
        where: { id },
    })

    const { objs: billingContexts, loading: billingContextsLoading, error: billingContextsError } = BillingIntegrationOrganizationContext.useObjects({
        where: { organization: { id: organizationId } },
    })

    const { objs: acquiringContexts, loading: acquiringContextsLoading, error: acquiringContextsError } = AcquiringIntegrationContext.useObjects({
        where: { organization: { id: organizationId } },
    })

    const redirectUrl = `/miniapps/${id}?type=${BILLING_APP_TYPE}`

    const initialAction = BillingIntegrationOrganizationContext.useCreate({
        settings: { dv: 1 },
        state: { dv: 1 },
    }, () => {
        router.push(redirectUrl)
    })

    const createContextAction = useCallback(() => {
        initialAction({ organization: { connect: { id:organizationId } }, integration: { connect:{ id } } } )
    }, [initialAction, id, organizationId])

    // NOTE: Page visiting is valid if:
    // Billing context not exist
    // If context exist -> redirect to app index page
    useEffect(() => {
        if (integration && !billingContextsLoading && !billingContextsError && billingContexts) {
            if (billingContexts.some((context) => get(context, ['integration', 'id']) === integration.id)) {
                router.push(redirectUrl)
            }
        }
    }, [router, integration, billingContextsLoading, billingContextsError, billingContexts, id, redirectUrl])

    if (integrationLoading || billingContextsLoading || acquiringContextsLoading ||
        integrationError || billingContextsError || acquiringContextsError) {
        return (
            <LoadingOrErrorPage
                title={LoadingMessage}
                error={integrationError || billingContextsError || acquiringContextsError}
                loading={integrationLoading || billingContextsLoading || acquiringContextsLoading}
            />
        )
    }

    if (!integration) {
        return <Error statusCode={404}/>
    }

    const PageTitle = get(integration, 'name', BillingMessage)

    const aboutSections = get(integration, ['about', '0', 'props', 'sections'], [])

    const isAnyBillingConnected = Boolean(billingContexts.length)
    const isAnyAcquiringConnected = Boolean(acquiringContexts.length)

    return (
        <>
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
                        disabledConnect={isAnyBillingConnected || !isAnyAcquiringConnected}
                        connectAction={createContextAction}>
                        {
                            !isAnyAcquiringConnected && (
                                <NoAcquiring/>
                            )
                        }
                        {
                            isAnyBillingConnected && (
                                <AlreadyConnectedBilling/>
                            )
                        }
                    </AppDescriptionPageContent>
                </PageContent>
            </PageWrapper>
        </>
    )
}
