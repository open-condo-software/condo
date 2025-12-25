import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Space, Tooltip, Typography } from '@open-condo/ui'

import { SETTINGS_TAB_SUBSCRIPTION } from '@condo/domains/common/constants/settingsTabs'

export interface INoSubscriptionToolTipWrapper {
    key?: string
    element: JSX.Element
}

interface INoSubscriptionToolTipHook {
    wrapElementIntoNoSubscriptionToolTip: (params: INoSubscriptionToolTipWrapper) => JSX.Element
}

export const useNoSubscriptionToolTip = (): INoSubscriptionToolTipHook => {
    const intl = useIntl()
    const router = useRouter()

    const NoSubscriptionWarning = intl.formatMessage({ 
        id: 'subscription.warns.noActiveSubscription',
    })
    const ActivateSubscriptionButton = intl.formatMessage({
        id: 'subscription.warns.activateSubscriptionButton',
    })

    const handleActivateClick = useCallback(async () => {
        await router.push(`/settings?tab=${SETTINGS_TAB_SUBSCRIPTION}`)
    }, [router])

    const tooltipTitle = (
        <Space size={8} direction='vertical'>
            <Typography.Text size='small'>{NoSubscriptionWarning}</Typography.Text>
            <Button type='accent' size='medium' onClick={handleActivateClick}>
                {ActivateSubscriptionButton}
            </Button>
        </Space>
    )

    const wrapElementIntoNoSubscriptionToolTip = (params: INoSubscriptionToolTipWrapper): JSX.Element => {
        return (
            <Tooltip
                key={params.key}
                title={tooltipTitle}
                placement='right'
            >
                {params.element}
            </Tooltip>
        )
    }

    return { wrapElementIntoNoSubscriptionToolTip }
}
