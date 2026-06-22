import getConfig from 'next/config'
import { useMemo } from 'react'

import { CONTEXT_FINISHED_STATUS as ACQUIRING_CONTEXT_FINISHED_STATUS } from '@condo/domains/acquiring/constants/context'
import { ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE } from '@condo/domains/acquiring/constants/integration'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'

import type { AcquiringIntegrationContext, BillingIntegrationOrganizationContext } from '@app/condo/schema'

const { publicRuntimeConfig: { sppConfig } } = getConfig()

type UseBillingPartnerContextsResult = {
    billingContexts: BillingIntegrationOrganizationContext[]
    acquiringContexts: AcquiringIntegrationContext[]
    sppBillingContext: BillingIntegrationOrganizationContext | null
    platformPartnerContext: AcquiringIntegrationContext | null
    activePlatformPartnerContext: AcquiringIntegrationContext | null
}

export const useBillingPartnerContexts = (): UseBillingPartnerContextsResult => {
    const { billingContexts, acquiringContexts } = useBillingAndAcquiringContexts()

    const sppBillingContext = useMemo(() => {
        const sppBillingId = sppConfig?.BillingIntegrationId
        if (!sppBillingId) return null

        return billingContexts.find(({ integration }) => integration?.id === sppBillingId) || null
    }, [billingContexts])

    const platformPartnerContext = useMemo(() => {
        return acquiringContexts.find(({ integration }) => integration?.type === ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE) || null
    }, [acquiringContexts])

    const activePlatformPartnerContext = useMemo(() => {
        return acquiringContexts.find(({ integration, reason, status }) => {
            return integration?.type === ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE
                && status === ACQUIRING_CONTEXT_FINISHED_STATUS
                && Boolean(reason?.trim())
        }) || null
    }, [acquiringContexts])

    return {
        billingContexts,
        acquiringContexts,
        sppBillingContext,
        platformPartnerContext,
        activePlatformPartnerContext,
    }
}
