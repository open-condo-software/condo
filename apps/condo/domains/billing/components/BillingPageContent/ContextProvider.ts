import { createContext, useContext } from 'react'

import type { BillingIntegrationOrganizationContext, AcquiringIntegrationContext } from '@app/condo/schema'

type IBillingAndAcquiringContexts = {
    billingContexts: BillingIntegrationOrganizationContext[]
    acquiringContexts: AcquiringIntegrationContext[]
    refetchBilling: () => void
}

export const BillingAndAcquiringContext = createContext<IBillingAndAcquiringContexts>({
    billingContexts: [],
    acquiringContexts: [],
    refetchBilling: () => ({}),
})

export function useBillingAndAcquiringContexts (): IBillingAndAcquiringContexts {
    return useContext(BillingAndAcquiringContext)
}

