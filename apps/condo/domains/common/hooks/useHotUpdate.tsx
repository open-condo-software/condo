import React, { useEffect } from 'react'
import { notification } from 'antd'
import Router from 'next/router'
import { useCurrentBuild } from './useCurrentBuild'
import { usePrevious } from './usePrevious'
import { useIntl } from 'react-intl'

const DELAY_IN_SECONDS = 5


export function useHotUpdate (): void {
    const intl = useIntl()
    const NotificationTitle = intl.formatMessage({ id: 'HotReload.title' })
    const NotificationMessage = intl.formatMessage({ id: 'HotReload.message' })
    const buildId = useCurrentBuild()
    const previousBuildId = usePrevious<string>(buildId)

    useEffect(() => {
        if (buildId && previousBuildId && previousBuildId !== buildId) {
            notification.warning({
                message: NotificationTitle,
                description: NotificationMessage,
                duration: DELAY_IN_SECONDS,
                closeIcon: React.Fragment,
            })
            setTimeout(() => {
                Router.reload()
            }, DELAY_IN_SECONDS * 1000)
        }
    }, [buildId, previousBuildId, NotificationMessage, NotificationTitle])
}