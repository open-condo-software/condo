import { notification } from 'antd'
import Router from 'next/router'
import React, { useCallback, useEffect } from 'react'

import { usePrevious } from '@open-condo/codegen/utils/usePrevious'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { useCurrentBuild } from './useCurrentBuild'

/**
 * Periodically fetch information about build and compare it with previous value
 * If a change is found, a notification is shown to the user asking them to reload the tab
 */
export function useHotCodeReload (): void {
    const intl = useIntl()
    const NotificationTitle = intl.formatMessage({ id: 'HotCodeReload.title' })
    const NotificationMessage = intl.formatMessage({ id: 'HotCodeReload.message' })
    const ButtonLabel = intl.formatMessage({ id: 'HotCodeReload.action' })

    const buildId = useCurrentBuild()
    const previousBuildId = usePrevious<string>(buildId)

    const handleNotificationClose = useCallback(() => {
        Router.reload()
    }, [])

    useEffect(() => {
        if (buildId && previousBuildId && previousBuildId !== buildId) {
            const btn: React.ReactNode = (
                <Button
                    type='primary'
                    size='medium'
                    onClick={handleNotificationClose}
                >
                    {ButtonLabel}
                </Button>
            )
            notification.success({
                key: buildId,
                btn,
                message: NotificationTitle,
                description: NotificationMessage,
                duration: null,
                closeIcon: null,
            })
        }
    }, [buildId, previousBuildId, NotificationTitle, NotificationMessage, ButtonLabel, handleNotificationClose])
}