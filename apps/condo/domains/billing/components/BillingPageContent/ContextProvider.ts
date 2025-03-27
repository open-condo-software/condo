import { createContext, useContext } from 'react'

import type { BillingIntegrationOrganizationContext, AcquiringIntegrationContext } from '@app/condo/schema'

type IBillingAndAcquiringContexts = {
    billingContext: BillingIntegrationOrganizationContext
    allBillingContexts: [BillingIntegrationOrganizationContext]
    acquiringContext: AcquiringIntegrationContext
    refetchBilling: () => void
}

export const BillingAndAcquiringContext = createContext<IBillingAndAcquiringContexts>({
    billingContext: null,
    allBillingContexts: [],
    acquiringContext: null,
    refetchBilling: () => ({}),
})

export function useBillingAndAcquiringContexts (): IBillingAndAcquiringContexts {
    return useContext(BillingAndAcquiringContext)
}

