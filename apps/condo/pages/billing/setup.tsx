import React, { useCallback, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'


import { CONTEXT_FINISHED_STATUS, CONTEXT_VERIFICATION_STATUS } from '@condo/domains/acquiring/constants/context'
import { ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE } from '@condo/domains/acquiring/constants/integration'
import { AcquiringIntegrationContext as AcquiringContext } from '@condo/domains/acquiring/utils/clientSchema'
import { BillingPageContent } from '@condo/domains/billing/components/BillingPageContent'
import { BillingAndAcquiringContext } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { BillingOnboardingPage } from '@condo/domains/billing/components/OnBoarding'
import { BillingOnboardingCombinedFlowPage } from '@condo/domains/billing/components/OnBoarding/BillingOnboardingCombinedFlowPage'
import { BillingIntegrationOrganizationContext as BillingContext } from '@condo/domains/billing/utils/clientSchema'
import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { UI_BILLING_SPP_COMBINED_PAGE } from '@condo/domains/common/constants/featureflags'
import { PageComponentType } from '@condo/domains/common/types'
import { CONTEXT_FINISHED_STATUS as BILLING_FINISHED_STATUS } from '@condo/domains/miniapp/constants'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'

const SetupBillingPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.accrualsAndPayments' })

    const { useFlag } = useFeatureFlags()
    const isCombinedFlow = useFlag(UI_BILLING_SPP_COMBINED_PAGE)


    const userOrganization = useOrganization()
    const orgId = userOrganization?.organization?.id ?? null
    const orgType = userOrganization?.organization?.type ?? MANAGING_COMPANY_TYPE
    const { objs: billingContexts, loading: billingLoading, error: billingError, refetch: refetchBilling } = BillingContext.useObjects({
        where: {
            status: BILLING_FINISHED_STATUS,
            organization: { id: orgId },
        },
    })
    const { objs: acquiringContexts, loading: acquiringLoading, error: acquiringError, refetch: refetchAcquiring } = AcquiringContext.useObjects({
        where: {
            status_in: [CONTEXT_FINISHED_STATUS, CONTEXT_VERIFICATION_STATUS],
            organization: { id: orgId },
        },
    })

    const handleFinishSetup = useCallback(() => {
        refetchBilling().then(() => refetchAcquiring())
    }, [refetchBilling, refetchAcquiring])

    const onlineProcessingAcquiringContext = useMemo(() => {
        return acquiringContexts.find(({ integration }) => integration?.type === ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE)
    }, [acquiringContexts])

    const providerValue = useMemo(() => ({ billingContexts: billingContexts, acquiringContexts: acquiringContexts, refetchBilling }), [acquiringContexts, billingContexts, refetchBilling])
    if (!isCombinedFlow) {
        return <AccessDeniedPage /> 
    }

    if (acquiringLoading || billingLoading || acquiringError || acquiringLoading) {
        return (
            <LoadingOrErrorPage
                title={PageTitle}
                error={acquiringError || billingError}
                loading={acquiringLoading || billingLoading}
            />
        )
    }

    const withVerification = (onlineProcessingAcquiringContext && onlineProcessingAcquiringContext.status === CONTEXT_VERIFICATION_STATUS) ||
        orgType === SERVICE_PROVIDER_TYPE

    
    return (
        <BillingOnboardingCombinedFlowPage onFinish={handleFinishSetup} withVerification={withVerification}/>
    )
}

SetupBillingPage.requiredAccess = OrganizationRequired

export default SetupBillingPage
