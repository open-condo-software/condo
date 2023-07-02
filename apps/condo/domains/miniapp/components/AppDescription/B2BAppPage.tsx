import get from 'lodash/get'
import Error from 'next/error'
import Head from 'next/head'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { PageWrapper, PageContent as PageContentWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useConnectedAppsWithIconsContext } from '@condo/domains/miniapp/components/ConnectedAppsWithIconsProvider'
import { B2B_APP_TYPE } from '@condo/domains/miniapp/constants'
import { B2BApp, B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'

import { ConnectModal } from './ConnectModal'
import { PageContent } from './PageContent'


type B2BPageProps = {
    id: string
}

export const B2BAppPage: React.FC<B2BPageProps> = ({ id }) => {
    const intl = useIntl()
    const { refetch: refetchMenu } = useConnectedAppsWithIconsContext()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)
    const [modalOpen, setModalOpen] = useState(false)

    const { obj: app, error: appError, loading: appLoading } = B2BApp.useObject({ where: { id } })
    const {
        obj: context,
        error: contextError,
        loading: contextLoading,
        refetch,
    } = B2BAppContext.useObject({ where: { app: { id }, organization: { id: organizationId } } })
    const appId = get(app, 'id', null)

    const initialAction = B2BAppContext.useCreate({}, () => {
        refetch()
        refetchMenu()
        setModalOpen(true)
    })
    const createContextAction = useCallback(() => {
        initialAction({ organization: { connect: { id: organizationId } }, app: { connect: { id: appId } } })
    }, [initialAction, organizationId, appId])

    const handleCloseModal = useCallback(() => {
        setModalOpen(false)
    }, [])

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
                        type={B2B_APP_TYPE}
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
                        contextStatus={get(context, 'status', null)}
                        appUrl={app.appUrl}
                        connectAction={createContextAction}
                    />
                    <ConnectModal
                        miniappHasFrame={Boolean(app.appUrl)}
                        miniappHasIcon={Boolean(app.icon)}
                        contextStatus={get(context, 'status', null)}
                        open={modalOpen}
                        closeModal={handleCloseModal}
                    />
                </PageContentWrapper>
            </PageWrapper>
        </>
    )
}