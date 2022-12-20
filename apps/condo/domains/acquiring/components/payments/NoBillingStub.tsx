import EmptyListView from '@condo/domains/common/components/EmptyListView'
import React from 'react'
import { useIntl } from '@open-condo/next/intl'
import { ACCRUALS_AND_PAYMENTS_CATEGORY } from '@condo/domains/miniapp/constants'

const NoBillingStub = (): JSX.Element => {
    const intl = useIntl()

    const noBillingLabel = intl.formatMessage({ id: 'pages.condo.payments.noBillingLabel' })
    const noBillingMessage = intl.formatMessage({ id: 'pages.condo.payments.noBillingMessage' })
    const createBillingLabel = intl.formatMessage({ id: 'pages.condo.payments.createBillingLabel' })
    const createBillingRoute = `/miniapps?tab=${ACCRUALS_AND_PAYMENTS_CATEGORY}`

    return (
        <EmptyListView
            label={noBillingLabel}
            message={noBillingMessage}
            createRoute={createBillingRoute}
            createLabel={createBillingLabel}
        />
    )
}

export default NoBillingStub