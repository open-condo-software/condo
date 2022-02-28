import { AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'
import NoAcquiringStub from '@condo/domains/billing/components/payments/NoAcquiringStub'
import NoBillingStub from '@condo/domains/billing/components/payments/NoBillingStub'
import PaymentsTable from '@condo/domains/billing/components/payments/PaymentsTable'
import { BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import { useOrganization } from '@core/next/organization'
import { get } from 'lodash'
import React from 'react'

const PaymentsPageContent = (): JSX.Element => {
    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], '')

    const {
        obj: billingContext,
        error: billingContextError,
        loading: billingContextLoading,
    } = BillingIntegrationOrganizationContext.useObject({
        where: {
            organization: {
                id: organizationId,
            },
        },
    }, {
        fetchPolicy: 'network-only',
    })

    const {
        obj: acquiringContext,
        error: acquiringContextError,
        loading: acquiringContextLoading,
    } = AcquiringIntegrationContext.useObject({
        where: {
            organization: {
                id: organizationId,
            },
        },
    }, {
        fetchPolicy: 'network-only',
    })

    if (billingContextLoading || acquiringContextLoading) {
        return <Loader fill/>
    }

    // TODO: show error

    if (!acquiringContextLoading && !acquiringContext) {
        return <NoAcquiringStub/>
    }

    if (!billingContextLoading && !billingContext) {
        return <NoBillingStub/>
    }

    return <PaymentsTable/>
}

export default PaymentsPageContent