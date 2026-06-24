import getConfig from 'next/config'
import { useMemo } from 'react'

import {
    CONTEXT_FINISHED_STATUS as ACQUIRING_CONTEXT_FINISHED_STATUS,
} from '@condo/domains/acquiring/constants/context'
import { ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE } from '@condo/domains/acquiring/constants/integration'
import { VIEW_TYPES, ViewTypes } from '@condo/domains/acquiring/utils/clientSchema'
import { ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY } from '@condo/domains/billing/constants/constants'
import { CONTEXT_FINISHED_STATUS as BILLING_CONTEXT_FINISHED_STATUS } from '@condo/domains/miniapp/constants'

import type { AcquiringIntegrationContext, BillingIntegrationOrganizationContext } from '@app/condo/schema'

const {
    publicRuntimeConfig: { registryUploadIntegrationId, sppConfig },
} = getConfig()

export const DEFAULT_COMBINED_VIEW_TYPES = [VIEW_TYPES.registry, VIEW_TYPES.list]

type UseCombinedViewAvailabilityArgs = {
    activeTab: string
    type?: string
    billingContexts: BillingIntegrationOrganizationContext[]
    acquiringContexts: AcquiringIntegrationContext[]
}

type UseCombinedViewAvailabilityResult = {
    availableTypesByTab: Record<string, ViewTypes[]>
    availableTypesForActiveTab: ViewTypes[]
    activeType: ViewTypes
}

export const useCombinedViewAvailability = ({
    activeTab,
    type,
    billingContexts,
    acquiringContexts,
}: UseCombinedViewAvailabilityArgs): UseCombinedViewAvailabilityResult => {
    const sppBillingId = sppConfig?.BillingIntegrationId || null

    const finishedBillingContexts = useMemo(() => {
        return billingContexts.filter(({ status }) => status === BILLING_CONTEXT_FINISHED_STATUS)
    }, [billingContexts])

    const hasFinishedOnlineProcessingAcquiringContext = useMemo(() => {
        return acquiringContexts.some(({ integration, status }) => (
            integration?.type === ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE
            && status === ACQUIRING_CONTEXT_FINISHED_STATUS
        ))
    }, [acquiringContexts])

    const hasOnlyOneBillingContext = finishedBillingContexts.length === 1

    const hasOnlyExternalBillingContexts = useMemo(() => {
        if (!finishedBillingContexts.length) return false

        return finishedBillingContexts.every(({ integration }) => {
            const integrationId = integration?.id

            return Boolean(integrationId && integrationId !== registryUploadIntegrationId && integrationId !== sppBillingId)
        })
    }, [finishedBillingContexts, sppBillingId])

    const hasSingleSppBillingContextWithoutFinishedOnlineProcessing = useMemo(() => {
        if (!hasOnlyOneBillingContext) return false

        const [billingContext] = finishedBillingContexts

        return billingContext?.integration?.id === sppBillingId && !hasFinishedOnlineProcessingAcquiringContext
    }, [finishedBillingContexts, hasFinishedOnlineProcessingAcquiringContext, hasOnlyOneBillingContext, sppBillingId])

    const availableTypesByTab = useMemo<Record<string, ViewTypes[]>>(() => {
        if (hasSingleSppBillingContextWithoutFinishedOnlineProcessing) {
            return {
                [ACCRUALS_TAB_KEY]: [VIEW_TYPES.registry],
                [PAYMENTS_TAB_KEY]: [VIEW_TYPES.registry],
            }
        }

        if (hasOnlyExternalBillingContexts) {
            return {
                [ACCRUALS_TAB_KEY]: [VIEW_TYPES.list],
                [PAYMENTS_TAB_KEY]: DEFAULT_COMBINED_VIEW_TYPES,
            }
        }

        return {
            [ACCRUALS_TAB_KEY]: DEFAULT_COMBINED_VIEW_TYPES,
            [PAYMENTS_TAB_KEY]: DEFAULT_COMBINED_VIEW_TYPES,
        }
    }, [hasOnlyExternalBillingContexts, hasSingleSppBillingContextWithoutFinishedOnlineProcessing])

    const availableTypesForActiveTab = useMemo(() => {
        return availableTypesByTab[activeTab] || DEFAULT_COMBINED_VIEW_TYPES
    }, [activeTab, availableTypesByTab])

    const activeType = useMemo(() => {
        return availableTypesForActiveTab.includes(type as ViewTypes)
            ? type as ViewTypes
            : availableTypesForActiveTab[0]
    }, [availableTypesForActiveTab, type])


    return {
        availableTypesByTab,
        availableTypesForActiveTab,
        activeType,
    }
}
