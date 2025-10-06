import get from 'lodash/get'
import Error from 'next/error'
import Head from 'next/head'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { PageWrapper, PageContent as PageContentWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useConnectedAppsWithIconsContext } from '@condo/domains/miniapp/components/ConnectedAppsWithIconsProvider'
import { B2BApp, B2BAppContext, B2BAppRole } from '@condo/domains/miniapp/utils/clientSchema'

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
    const employeeRoleId = get(userOrganization, ['link', 'role', 'id'], null)
    const [modalOpen, setModalOpen] = useState(false)

    const { obj: app, error: appError, loading: appLoading } = B2BApp.useObject({ where: { id } })
    const {
        obj: context,
        error: contextError,
        loading: contextLoading,
        refetch: refetchContext,
    } = B2BAppContext.useObject({ where: { app: { id }, organization: { id: organizationId } } })

    const {
        obj: appRole,
        loading: appRoleLoading,
        error: appRoleError,
        refetch: refetchRole,
    } = B2BAppRole.useObject({ where:{ app: { id }, role: { id: employeeRoleId } } })

    const appId = get(app, 'id', null)

    const initialAction = B2BAppContext.useCreate({}, () => {
        refetchContext()
        refetchMenu()
        refetchRole()
        setModalOpen(true)
    })
    const createContextAction = useCallback(() => {
        if (!userOrganization.isLoading) {
            initialAction({ organization: { connect: { id: organizationId } }, app: { connect: { id: appId } } })
        }
    }, [initialAction, organizationId, appId])

    const handleCloseModal = useCallback(() => {
        setModalOpen(false)
    }, [])

    if (appLoading || contextLoading || appRoleLoading || appError || contextError || appRoleError) {
        return (
            <LoadingOrErrorPage
                title={LoadingMessage}
                error={appError || contextError || appRoleError}
                loading={appLoading || contextLoading || appRoleLoading}
            />
        )
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
                        developerUrl={app.developerUrl}
                        price={app.price}
                        gallery={app.gallery}
                        contextStatus={get(context, 'status', null)}
                        appUrl={app.appUrl}
                        accessible={Boolean(appRole)}
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