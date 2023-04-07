import get from 'lodash/get'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { AcquiringIntegrationContext as AcquiringContext } from '@condo/domains/acquiring/utils/clientSchema'
import { BillingOnboardingPage } from '@condo/domains/billing/components/OnBoarding'
import { BillingIntegrationOrganizationContext as BillingContext } from '@condo/domains/billing/utils/clientSchema'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { CONTEXT_FINISHED_STATUS } from '@condo/domains/miniapp/constants'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

type PageType = React.FC & {
    requiredAccess: React.FC
}

const AccrualsAndPaymentsPage: PageType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.accrualsAndPayments' })

    const userOrganization = useOrganization()
    const orgId = get(userOrganization, ['organization', 'id'], null)
    const { obj: billingCtx, loading: billingLoading, error: billingError, refetch: refetchBilling } = BillingContext.useObject({
        where: {
            status: CONTEXT_FINISHED_STATUS,
            organization: { id: orgId },
        },
    })
    const { obj: acquiringCtx, loading: acquiringLoading, error: acquiringError, refetch: refetchAcquiring } = AcquiringContext.useObject({
        where: {
            status: CONTEXT_FINISHED_STATUS,
            organization: { id: orgId },
        },
    })

    const handleFinishSetup = useCallback(() => {
        refetchBilling().then(() => refetchAcquiring())
    }, [refetchBilling, refetchAcquiring])

    if (acquiringLoading || billingLoading || acquiringError || acquiringLoading) {
        return (
            <LoadingOrErrorPage
                title={PageTitle}
                error={acquiringError || billingError}
                loading={acquiringLoading || billingLoading}
            />
        )
    }

    const msg = '// TODO: Errors and dinosaurs'
    if (billingCtx && acquiringCtx) {
        return <div>
            <Typography.Title>{msg}</Typography.Title>
        </div>
    }

    return (
        <BillingOnboardingPage onFinish={handleFinishSetup}/>
    )
}

AccrualsAndPaymentsPage.requiredAccess = OrganizationRequired

export default AccrualsAndPaymentsPage