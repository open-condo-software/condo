import get from 'lodash/get'
import React, { useCallback } from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'


import { CONTEXT_FINISHED_STATUS, CONTEXT_VERIFICATION_STATUS } from '@condo/domains/acquiring/constants/context'
import { AcquiringIntegrationContext as AcquiringContext } from '@condo/domains/acquiring/utils/clientSchema'
import { BillingPageContent } from '@condo/domains/billing/components/BillingPageContent'
import { BillingAndAcquiringContext } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { BillingOnboardingPage } from '@condo/domains/billing/components/OnBoarding'
import { BillingIntegrationOrganizationContext as BillingContext } from '@condo/domains/billing/utils/clientSchema'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState, ifSsrIsNotDisabled } from '@condo/domains/common/utils/next/ssr'
import { CONTEXT_FINISHED_STATUS as BILLING_FINISHED_STATUS } from '@condo/domains/miniapp/constants'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'

import type { GetServerSideProps } from 'next'


type PageType = React.FC & {
    requiredAccess: React.FC
}

const AccrualsAndPaymentsPage: PageType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.accrualsAndPayments' })

    const userOrganization = useOrganization()
    const orgId = get(userOrganization, ['organization', 'id'], null)
    const orgType = get(userOrganization, ['organization', 'type'], MANAGING_COMPANY_TYPE)
    const { obj: billingCtx, loading: billingLoading, error: billingError, refetch: refetchBilling } = BillingContext.useObject({
        where: {
            status: BILLING_FINISHED_STATUS,
            organization: { id: orgId },
        },
    })
    const { obj: acquiringCtx, loading: acquiringLoading, error: acquiringError, refetch: refetchAcquiring } = AcquiringContext.useObject({
        where: {
            status_in: [CONTEXT_FINISHED_STATUS, CONTEXT_VERIFICATION_STATUS],
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

    if (billingCtx && acquiringCtx && get(acquiringCtx, 'status') === CONTEXT_FINISHED_STATUS) {
        return (
            <BillingAndAcquiringContext.Provider value={{ billingContext: billingCtx, acquiringContext: acquiringCtx, refetchBilling }}>
                <BillingPageContent/>
            </BillingAndAcquiringContext.Provider>
        )
    }

    const withVerification = (acquiringCtx && acquiringCtx.status === CONTEXT_VERIFICATION_STATUS) ||
        orgType === SERVICE_PROVIDER_TYPE

    return (
        <BillingOnboardingPage onFinish={handleFinishSetup} withVerification={withVerification}/>
    )
}

AccrualsAndPaymentsPage.requiredAccess = OrganizationRequired

export default AccrualsAndPaymentsPage

export const getServerSideProps: GetServerSideProps = ifSsrIsNotDisabled(async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
})
