import React from 'react'
import get from 'lodash/get'
import Error from 'next/error'
import Head from 'next/head'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { B2BApp, B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageWrapper, PageContent as PageContentWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageContent } from './PageContent'

type B2BPageProps = {
    id: string
}

export const B2BAppPage: React.FC<B2BPageProps> = ({ id }) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)

    const { obj: app, error: appError, loading: appLoading } = B2BApp.useObject({ where: { id } })
    const {
        obj: context,
        error: contextError,
        loading: contextLoading,
    } = B2BAppContext.useObject({ where: { app: { id }, organization: { id: organizationId } } })



    if (appLoading || contextLoading || appError || contextError) {
        return <LoadingOrErrorPage title={LoadingMessage} error={appError || contextError} loading={appLoading || contextLoading}/>
    }
    if (!app) {
        return <Error statusCode={404}/>
    }

    return (
        <>
            <Head>
                <title>{app.name}</title>
            </Head>
            <PageWrapper>
                <PageContentWrapper>
                    <PageContent
                        id={app.id}
                        name={app.name}
                        category={app.category}
                        label={app.label}
                        shortDescription={app.shortDescription}
                        detailedDescription={app.detailedDescription}
                        developer={app.developer}
                        publishedAt={app.createdAt}
                        partnerUrl={app.partnerUrl}
                        price={app.price}
                        gallery={app.gallery}
                    />
                </PageContentWrapper>
            </PageWrapper>
        </>
    )
}