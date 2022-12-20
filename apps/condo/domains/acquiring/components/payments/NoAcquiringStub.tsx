import EmptyListView from '@condo/domains/common/components/EmptyListView'
import React from 'react'
import { useIntl } from '@open-condo/next/intl'
import { ACCRUALS_AND_PAYMENTS_CATEGORY } from '@condo/domains/miniapp/constants'

const NoAcquiringStub = (): JSX.Element => {
    const intl = useIntl()

    const noAcquiringLabel = intl.formatMessage({ id: 'pages.condo.payments.noAcquiringLabel' })
    const noAcquiringMessage = intl.formatMessage({ id: 'pages.condo.payments.noAcquiringMessage' })
    const createAcquiringLabel = intl.formatMessage({ id: 'pages.condo.payments.createAcquiringLabel' })
    const createAcquiringRoute = `/miniapps?tab=${ACCRUALS_AND_PAYMENTS_CATEGORY}`

    return (
        <EmptyListView
            label={noAcquiringLabel}
            message={noAcquiringMessage}
            createRoute={createAcquiringRoute}
            createLabel={createAcquiringLabel}
        />
    )
}

export default NoAcquiringStub