import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { CONTEXT_FINISHED_STATUS } from '@condo/domains/acquiring/constants/context'
import { useAcquiringIntegrationContext } from '@condo/domains/acquiring/hooks/useAcquiringIntegrationContext'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { MarketplacePageContent } from '@condo/domains/marketplace/components/MarketplacePageContent'
import {
    AcquiringContext as AcquiringContextProvider,
} from '@condo/domains/marketplace/components/MarketplacePageContent/ContextProvider'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

type PageType = React.FC & {
    requiredAccess: React.FC
}

const MarketplacePage: PageType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.marketplace.title' })

    const {
        acquiringIntegrationContext,
        loading,
        error,
        refetchAcquiringIntegrationContext,
    } = useAcquiringIntegrationContext({ invoiceStatus: CONTEXT_FINISHED_STATUS })

    if (loading || error) {
        return <LoadingOrErrorPage title={PageTitle} error={error} loading={loading}/>
    }

    return (
        <AcquiringContextProvider.Provider value={{
            acquiringContext: acquiringIntegrationContext,
            refetchAcquiringContext: refetchAcquiringIntegrationContext,
        }}>
            <MarketplacePageContent/>
        </AcquiringContextProvider.Provider>
    )
}

MarketplacePage.requiredAccess = OrganizationRequired

export default MarketplacePage
