import get from 'lodash/get'
import Error from 'next/error'
import Head from 'next/head'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { AcquiringIntegration, AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'
import { PageWrapper, PageContent as PageContentWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { ACQUIRING_APP_TYPE, ACCRUALS_AND_PAYMENTS_CATEGORY } from '@condo/domains/miniapp/constants'

import { ConnectModal } from './ConnectModal'
import { PageContent } from './PageContent'

type AcquiringAppPageProps = {
    id: string
}

export const AcquiringAppPage: React.FC<AcquiringAppPageProps> = ({ id }) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)
    const [modalOpen, setModalOpen] = useState(false)

    const { obj: app, error: appError, loading: appLoading } = AcquiringIntegration.useObject({ where: { id } })
    const {
        obj: context,
        error: contextError,
        loading: contextLoading,
        refetch,
    } = AcquiringIntegrationContext.useObject({ where: { integration: { id }, organization: { id: organizationId } } })
    const appId = get(app, 'id', null)

    const initialAction = AcquiringIntegrationContext.useCreate({
        settings: { dv: 1 },
        state: { dv: 1 },
    }, () => {
        refetch()
        setModalOpen(true)
    })
    const createContextAction = useCallback(() => {
        initialAction({ organization: { connect: { id: organizationId } }, integration: { connect: { id: appId } } })
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
                        type={ACQUIRING_APP_TYPE}
                        name={app.name}
                        category={ACCRUALS_AND_PAYMENTS_CATEGORY}
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
                        contextStatus={get(context, 'status', null)}
                        open={modalOpen}
                        closeModal={handleCloseModal}
                    />
                </PageContentWrapper>
            </PageWrapper>
        </>
    )
}