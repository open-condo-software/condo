import React from 'react'

import { PAYMENT_TYPES, PaymentTypes } from '@condo/domains/acquiring/utils/clientSchema'
import Payments from '@condo/domains/billing/components/BillingPageContent/PaymentsTab/Payments'
import PaymentsFiles from '@condo/domains/billing/components/BillingPageContent/PaymentsTab/PaymentsFiles'


interface PaymentsTabProps {
    type: PaymentTypes
}

export const PaymentsTab = ({ type }: PaymentsTabProps): JSX.Element => {
    if (type === PAYMENT_TYPES.registry) {
        return <PaymentsFiles />
    }

    return <Payments />
}