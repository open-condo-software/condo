import React, { useEffect } from 'react'
import { AcquiringIntegration, AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'
import get from 'lodash/get'
import { useOrganization } from '@core/next/organization'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useIntl } from '@core/next/intl'
import Error from 'next/error'
import Head from 'next/head'
import { PageContent, PageWrapper, PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import IFrame from '@condo/domains/common/components/IFrame'
import { ACQUIRING_APP_TYPE } from '@condo/domains/miniapp/constants'
import { Typography } from 'antd'
import { AppConnectedPageContent } from './AppConnectedPageContent'
import { useRouter } from 'next/router'

interface IndexAcquiringAppPageProps {
    id: string,
}

export const IndexAcquiringAppPage: React.FC<IndexAcquiringAppPageProps> = ({ id }) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const AcquiringMessage = intl.formatMessage({ id: `miniapps.category.${ACQUIRING_APP_TYPE}` })

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)

    const router = useRouter()

    const { obj: integration, loading: integrationLoading, error: integrationError } = AcquiringIntegration.useObject({
        where: { id },
    })

    const { obj: context, loading: contextLoading, error: contextError } = AcquiringIntegrationContext.useObject({
        where: {
            organization: { id: organizationId },
            integration: { id },
        },
    })

    // NOTE: Page visiting is valid only if context exist:
    useEffect(() => {
        if (!contextLoading && !contextError && !context) {
            router.push(`/miniapps/${id}/about?type=${ACQUIRING_APP_TYPE}`)
        }
    }, [router, context, id, contextLoading, contextError])

    if (integrationLoading || contextLoading || integrationError || contextError) {
        return (
            <LoadingOrErrorPage title={LoadingMessage} error={integrationError || contextError} loading={integrationLoading || contextLoading}/>
        )
    }

    if (!integration) {
        return <Error statusCode={404}/>
    }

    const PageTitle = get(integration, 'name', AcquiringMessage)
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
                                tag={AcquiringMessage}
                                partnerUrl={get(integration, 'partnerUrl')}
                            />
                        )
                    }
                </PageContent>
            </PageWrapper>
        </>
    )
}