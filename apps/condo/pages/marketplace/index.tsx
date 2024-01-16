import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { CONTEXT_FINISHED_STATUS } from '@condo/domains/acquiring/constants/context'
import { AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { MarketplacePageContent } from '@condo/domains/marketplace/components/MarketplacePageContent'
import {
    AcquiringContext as AcquiringContextProvider,
} from '@condo/domains/marketplace/components/MarketplacePageContent/ContextProvider'
import { MarketplaceReadPermissionRequired } from '@condo/domains/marketplace/components/PageAccess'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'


type PageType = React.FC & {
    requiredAccess: React.FC
}

const MarketplacePage: PageType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.marketplace.title' })

    const router = useRouter()
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const isServiceProviderOrganization = useMemo(() => (get(organization, 'type', MANAGING_COMPANY_TYPE) === SERVICE_PROVIDER_TYPE), [organization])

    useEffect(() => {
        if (isServiceProviderOrganization) router.push('/')
    }, [isServiceProviderOrganization])

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
