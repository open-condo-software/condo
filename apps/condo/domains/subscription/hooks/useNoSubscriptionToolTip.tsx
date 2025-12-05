import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tooltip } from '@open-condo/ui'

export interface INoSubscriptionToolTipWrapper {
    key?: string
    element: JSX.Element
}

interface INoSubscriptionToolTipHook {
    wrapElementIntoNoSubscriptionToolTip: (params: INoSubscriptionToolTipWrapper) => JSX.Element
}

export const useNoSubscriptionToolTip = (): INoSubscriptionToolTipHook => {
    const intl = useIntl()
    const NoSubscriptionWarning = intl.formatMessage({ 
        id: 'subscription.warns.noActiveSubscription',
        defaultMessage: 'Для доступа к этому разделу необходима активная подписка',
    })

    const wrapElementIntoNoSubscriptionToolTip = (params: INoSubscriptionToolTipWrapper): JSX.Element => {
        return (
            <Tooltip
                key={params.key}
                title={NoSubscriptionWarning}
                placement='right'
            >
                {params.element}
            </Tooltip>
        )
    }

    return { wrapElementIntoNoSubscriptionToolTip }
}
