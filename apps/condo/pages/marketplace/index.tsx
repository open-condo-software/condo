import get from 'lodash/get'
import Head from 'next/head'
import React, { useMemo } from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'


import { CONTEXT_FINISHED_STATUS } from '@condo/domains/acquiring/constants/context'
import { AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'
import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { usePreviousSortAndFilters } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState, ifSsrIsNotDisabled } from '@condo/domains/common/utils/next/ssr'
import { MarketplacePageContent } from '@condo/domains/marketplace/components/MarketplacePageContent'
import {
    AcquiringContext as AcquiringContextProvider,
} from '@condo/domains/marketplace/components/MarketplacePageContent/ContextProvider'
import { MarketplaceReadPermissionRequired } from '@condo/domains/marketplace/components/PageAccess'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'

import type { GetServerSideProps } from 'next'


type PageType = React.FC & {
    requiredAccess: React.FC
}

const MarketplacePage: PageType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.marketplace.title' })

    const { organization, link } = useOrganization()
    const orgId = get(organization, 'id', null)
    const employeeId = get(link, 'id')
    const isServiceProviderOrganization = useMemo(() => (get(organization, 'type', MANAGING_COMPANY_TYPE) === SERVICE_PROVIDER_TYPE), [organization])

    usePreviousSortAndFilters({ paramNamesForPageChange: ['tab'], employeeSpecificKey: employeeId })

    const {
        obj: acquiringIntegrationContext,
        loading,
        error,
        refetch: refetchAcquiringIntegrationContext,
    } = AcquiringIntegrationContext.useObject({
        where: {
            invoiceStatus_in: [CONTEXT_FINISHED_STATUS],
            organization: { id: orgId },
        },
    })

    const payload = useMemo(() => ({
        acquiringContext: acquiringIntegrationContext,
        refetchAcquiringContext: refetchAcquiringIntegrationContext,
    }), [acquiringIntegrationContext, refetchAcquiringIntegrationContext])

    if (isServiceProviderOrganization) return <AccessDeniedPage/>

    if (loading || error) {
        return <LoadingOrErrorPage title={PageTitle} error={error} loading={loading}/>
    }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <AcquiringContextProvider.Provider value={payload}>
                <MarketplacePageContent/>
            </AcquiringContextProvider.Provider>
        </>
    )
}

MarketplacePage.requiredAccess = MarketplaceReadPermissionRequired

export default MarketplacePage

export const getServerSideProps: GetServerSideProps = ifSsrIsNotDisabled(async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
})
