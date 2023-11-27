import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { MarketplacePageContent } from '@condo/domains/marketplace/components/MarketplacePageContent'
import { InvoiceContext as InvoiceContextProvider } from '@condo/domains/marketplace/components/MarketplacePageContent/ContextProvider'
import { INVOICE_CONTEXT_STATUS_FINISHED } from '@condo/domains/marketplace/constants'
import { InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

type PageType = React.FC & {
    requiredAccess: React.FC
}

const MarketplacePage: PageType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.marketplace.title' })

    const userOrganization = useOrganization()
    const orgId = get(userOrganization, ['organization', 'id'], null)
    const { obj: invoiceContext, loading: invoiceContextLoading, error: invoiceContextError, refetch: refetchInvoice } = InvoiceContext.useObject({
        where: {
            status: INVOICE_CONTEXT_STATUS_FINISHED,
            organization: { id: orgId },
        },
    })

    if (invoiceContextLoading || invoiceContextError) {
        return (
            <LoadingOrErrorPage
                title={PageTitle}
                error={invoiceContextError}
                loading={invoiceContextLoading}
            />
        )
    }

    return (
        <InvoiceContextProvider.Provider value={{ invoiceContext: invoiceContext, refetchInvoiceContext: refetchInvoice }}>
            <MarketplacePageContent />
        </InvoiceContextProvider.Provider>
    )
}

MarketplacePage.requiredAccess = OrganizationRequired

export default MarketplacePage