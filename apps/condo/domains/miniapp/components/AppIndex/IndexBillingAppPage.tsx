import React, { useEffect } from 'react'
import { BillingIntegration, BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import get from 'lodash/get'
import { useOrganization } from '@core/next/organization'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useIntl } from '@core/next/intl'
import Error from 'next/error'
import Head from 'next/head'
import { PageContent, PageWrapper, PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import IFrame from '@condo/domains/common/components/IFrame'
import { BILLING_APP_TYPE } from '@condo/domains/miniapp/constants'
import { Typography } from 'antd'
import { AppConnectedPageContent } from './AppConnectedPageContent'
import { useRouter } from 'next/router'

interface IndexBillingAppPageProps {
    id: string,
}

export const IndexBillingAppPage: React.FC<IndexBillingAppPageProps> = ({ id }) => {
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

    const { obj: context, loading: contextLoading, error: contextError } = BillingIntegrationOrganizationContext.useObject({
        where: {
            organization: { id: organizationId },
            integration: { id },
        },
    })

    // NOTE: Page visiting is valid if:
    // Context exists or integration has appUrl
    // If no context and no appUrl -> redirect to about page
    useEffect(() => {
        if (integration && !contextLoading && !contextError && !context && !integration.appUrl) {
            router.push(`/miniapps/${id}/about?type=${BILLING_APP_TYPE}`)
        }
    }, [router, integration, context, id, contextLoading, integrationLoading, contextError])

    if (integrationLoading || contextLoading || integrationError || contextError) {
        return (
            <LoadingOrErrorPage title={LoadingMessage} error={integrationError || contextError} loading={integrationLoading || contextLoading}/>
        )
    }

    if (!integration) {
        return <Error statusCode={404}/>
    }

    const PageTitle = get(integration, 'name', BillingMessage)
    const hasFrame = Boolean(get(integration, ['appUrl']))

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                {
                    hasFrame && (
                        <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} spaced/>
                    )
                }
                <PageContent>
                    {
                        hasFrame ? (
                            <IFrame pageUrl={integration.appUrl} />
                        ) : (
                            <AppConnectedPageContent
                                title={integration.name}
                                description={integration.shortDescription}
                                published={integration.createdAt}
                                developer={integration.developer}
                                message={integration.connectedMessage}
                                logoSrc={get(integration, ['logo', 'publicUrl'])}
                                tag={TagMessage}
                                partnerUrl={get(integration, 'partnerUrl')}
                            />
                        )
                    }
                </PageContent>
            </PageWrapper>
        </>
    )
}