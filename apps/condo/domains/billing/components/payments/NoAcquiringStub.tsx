import EmptyListView from '@condo/domains/common/components/EmptyListView'
import React from 'react'
import { useIntl } from '@core/next/intl'

export const NoAcquiringStub = (): JSX.Element => {
    const intl = useIntl()

    const noAcquiringLabel = intl.formatMessage({ id: 'pages.condo.payments.noAcquiringLabel' })
    const noAcquiringMessage = intl.formatMessage({ id: 'pages.condo.payments.noAcquiringMessage' })
    const createAcquiringLabel = intl.formatMessage({ id: 'pages.condo.payments.createAcquiringLabel' })

    // TODO: find url to set up acquiring
    return (
        <EmptyListView
            label={noAcquiringLabel}
            message={noAcquiringMessage}
            createRoute={'/'}
            createLabel={createAcquiringLabel}
        />
    )
}