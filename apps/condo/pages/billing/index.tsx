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
import { BillingIntegrationOrganizationContext as BillingContext } from '@condo/domains/billing/utils/clientSchema'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { UI_BILLING_SPP_COMBINED_PAGE } from '@condo/domains/common/constants/featureflags'
import { PageComponentType } from '@condo/domains/common/types'
import { CONTEXT_FINISHED_STATUS as BILLING_FINISHED_STATUS } from '@condo/domains/miniapp/constants'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'

const AccrualsAndPaymentsPage: PageComponentType = () => {
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const isCombinedPageEnabled = useFlag(UI_BILLING_SPP_COMBINED_PAGE)
    const PageTitle = intl.formatMessage({ id: isCombinedPageEnabled ? 'global.section.SPP' : 'global.section.accrualsAndPayments' })

    const userOrganization = useOrganization()
    const orgId = userOrganization?.organization?.id ?? null
    const orgType = userOrganization?.organization?.type ?? MANAGING_COMPANY_TYPE
    const organizationWhere = useMemo(() => ({ organization: { id: orgId } }), [orgId])

    const { objs: billingContexts, loading: billingLoading, error: billingError, refetch: refetchBilling } = BillingContext.useObjects({
        where: {
            ...organizationWhere,
            ...(!isCombinedPageEnabled && { status: BILLING_FINISHED_STATUS }),
        },
    }, { skip: !orgId })

    const { objs: acquiringContexts, loading: acquiringLoading, error: acquiringError, refetch: refetchAcquiring } = AcquiringContext.useObjects({
        where: {
            ...organizationWhere,
            ...(!isCombinedPageEnabled && { status_in: [CONTEXT_FINISHED_STATUS, CONTEXT_VERIFICATION_STATUS] }),
        },
    }, { skip: !orgId })

    const handleFinishSetup = useCallback(() => {
        refetchBilling().then(() => refetchAcquiring())
    }, [refetchBilling, refetchAcquiring])

    const onlineProcessingAcquiringContext = useMemo(() => {
        return acquiringContexts.find(({ integration }) => integration?.type === ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE)
    }, [acquiringContexts])
    const hasFinishedBillingContext = useMemo(() => {
        return billingContexts.some(({ status }) => status === BILLING_FINISHED_STATUS)
    }, [billingContexts])

    const providerValue = useMemo(() => ({
        billingContexts,
        acquiringContexts,
        refetchBilling,
    }), [acquiringContexts, billingContexts, refetchBilling])

    const canShowBillingPage = isCombinedPageEnabled
        ? hasFinishedBillingContext
        : billingContexts.length > 0 && acquiringContexts.length > 0

    if (acquiringLoading || billingLoading || acquiringError || billingError) {
        return (
            <LoadingOrErrorPage
                title={PageTitle}
                error={acquiringError || billingError}
                loading={acquiringLoading || billingLoading}
            />
        )
    }

    if (canShowBillingPage) {
        return (
            <BillingAndAcquiringContext.Provider value={providerValue}>
                <BillingPageContent/>
            </BillingAndAcquiringContext.Provider>
        )
    }

    const withVerification = (onlineProcessingAcquiringContext && onlineProcessingAcquiringContext.status === CONTEXT_VERIFICATION_STATUS) ||
        orgType === SERVICE_PROVIDER_TYPE

    return (
        <BillingOnboardingPage onFinish={handleFinishSetup} withVerification={withVerification}/>
    )
}

AccrualsAndPaymentsPage.requiredAccess = OrganizationRequired

export default AccrualsAndPaymentsPage
