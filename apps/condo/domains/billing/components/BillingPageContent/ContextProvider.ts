import { createContext, useContext } from 'react'

import type { BillingIntegrationOrganizationContext, AcquiringIntegrationContext } from '@app/condo/schema'

type IBillingAndAcquiringContexts = {
    billingContext: BillingIntegrationOrganizationContext
    acquiringContext: AcquiringIntegrationContext
}

export const BillingAndAcquiringContext = createContext<IBillingAndAcquiringContexts>({
    billingContext: null,
    acquiringContext: null,
})

export function useBillingAndAcquiringContexts (): IBillingAndAcquiringContexts {
    return useContext(BillingAndAcquiringContext)
}

