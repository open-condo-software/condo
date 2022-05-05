import React, { useEffect } from 'react'
import { Typography } from 'antd'
import get from 'lodash/get'
import Error from 'next/error'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { B2BAppContext, B2BApp } from '@condo/domains/miniapp/utils/clientSchema'
import { B2B_APP_TYPE } from '@condo/domains/miniapp/constants'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageContent, PageWrapper, PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import IFrame from '@condo/domains/common/components/IFrame'
import { AppConnectedPageContent } from './AppConnectedPageContent'



interface IndexB2BAppPageProps {
    id: string,
}

export const IndexB2BAppPage: React.FC<IndexB2BAppPageProps> = ({ id }) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const router = useRouter()
    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)

    const { obj: app, loading: appLoading, error: appError } = B2BApp.useObject({
        where: { id },
    })

    const { obj: context, loading: contextLoading, error: contextError } = B2BAppContext.useObject({
        where: {
            organization: { id: organizationId },
            app: { id },
        },
    })

    // NOTE: Page visiting is valid only if context exist:
    useEffect(() => {
        if (!contextLoading && !contextError && !context) {
            router.push(`/miniapps/${id}/about?type=${B2B_APP_TYPE}`)
        }
    }, [router, context, id, contextLoading, contextError])

    if (appLoading || appError || contextLoading || contextError) {
        return <LoadingOrErrorPage title={LoadingMessage} error={contextError || appError} loading={appLoading || contextLoading}/>
    }

    if (!app) {
        return <Error statusCode={404}/>
    }

    const hasFrame = Boolean(get(app, ['appUrl']))
    const tagMessage = intl.formatMessage({ id: `miniapps.category.${app.category}` })

    return (
        <>
            <Head>
                <title>{app.name}</title>
            </Head>
            <PageWrapper>
                {
                    hasFrame && (
                        <PageHeader title={<Typography.Title>{app.name}</Typography.Title>} spaced/>
                    )
                }
                <PageContent>
                    {
                        hasFrame ? (
                            <IFrame pageUrl={app.appUrl} />
                        ) : (
                            <AppConnectedPageContent
                                title={app.name}
                                description={app.shortDescription}
                                published={app.createdAt}
                                developer={app.developer}
                                message={app.connectedMessage}
                                logoSrc={get(app, ['logo', 'publicUrl'])}
                                tag={tagMessage}
                                partnerUrl={app.partnerUrl}
                            />
                        )
                    }
                </PageContent>
            </PageWrapper>
        </>
    )
}