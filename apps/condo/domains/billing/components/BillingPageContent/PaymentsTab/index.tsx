import React from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import { PAYMENT_TYPES, PaymentTypes } from '@condo/domains/acquiring/utils/clientSchema'
import Payments from '@condo/domains/billing/components/BillingPageContent/PaymentsTab/Payments'
import PaymentsFiles from '@condo/domains/billing/components/BillingPageContent/PaymentsTab/PaymentsFiles'
import { ACQUIRING_PAYMENTS_FILES_TABLE } from '@condo/domains/common/constants/featureflags'


interface PaymentsTabProps {
    type: PaymentTypes
}

export const PaymentsTab = ({ type }: PaymentsTabProps): JSX.Element => {
    const { useFlag } = useFeatureFlags()
    const isPaymentsFilesTableEnabled = useFlag(ACQUIRING_PAYMENTS_FILES_TABLE)

    if (isPaymentsFilesTableEnabled && type === PAYMENT_TYPES.registry) {
        return <PaymentsFiles />
    }

    return <Payments />
}