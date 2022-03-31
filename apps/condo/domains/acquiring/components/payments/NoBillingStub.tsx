import EmptyListView from '@condo/domains/common/components/EmptyListView'
import React from 'react'
import { useIntl } from '@core/next/intl'

const NoBillingStub = (): JSX.Element => {
    const intl = useIntl()

    const noBillingLabel = intl.formatMessage({ id: 'pages.condo.payments.noBillingLabel' })
    const noBillingMessage = intl.formatMessage({ id: 'pages.condo.payments.noBillingMessage' })
    const createBillingLabel = intl.formatMessage({ id: 'pages.condo.payments.createBillingLabel' })

    return (
        <EmptyListView
            label={noBillingLabel}
            message={noBillingMessage}
            createRoute="/miniapps?tab=billing"
            createLabel={createBillingLabel}
        />
    )
}

export default NoBillingStub