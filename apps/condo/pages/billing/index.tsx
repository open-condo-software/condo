import React, { useCallback, useMemo } from 'react'

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
import { PageComponentType } from '@condo/domains/common/types'
import { CONTEXT_FINISHED_STATUS as BILLING_FINISHED_STATUS } from '@condo/domains/miniapp/constants'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'

const AccrualsAndPaymentsPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.accrualsAndPayments' })

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
        return acquiringContexts.find(({ integration: { type } }) => type === ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE)
    }, [acquiringContexts])

    if (acquiringLoading || billingLoading || acquiringError || acquiringLoading) {
        return (
            <LoadingOrErrorPage
                title={PageTitle}
                error={acquiringError || billingError}
                loading={acquiringLoading || billingLoading}
            />
        )
    }

    if (billingContexts.length && acquiringContexts.length) {
        return (
            <BillingAndAcquiringContext.Provider value={{ billingContexts: billingContexts, acquiringContexts: acquiringContexts, refetchBilling }}>
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
