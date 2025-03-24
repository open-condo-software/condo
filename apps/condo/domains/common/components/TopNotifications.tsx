/** @jsx jsx */
import { jsx } from '@emotion/react'
import { Affix, AlertProps, Space } from 'antd'
import React, { useCallback, useState } from 'react'

import { Alert, Button } from '@open-condo/ui'


export interface ITopNotificationAction {
    action: () => Promise<void>
    title: string
    removeNotificationOnClick: boolean
    secondary?: boolean
}

export interface ITopNotification {
    id: string
    actions: ITopNotificationAction[]
    message: string | JSX.Element
    description?: string
    type: AlertProps['type']
}

interface ITopNotificationHookResult {
    TopNotificationComponent: React.FC
    addNotification: (notification: ITopNotification) => void
    removeNotification: (notificationId: string) => void
}

export const useTopNotificationsHook = (serviceProblemsAlert?: React.ReactNode): ITopNotificationHookResult => {
    const [topNotifications, setTopNotifications] = useState<ITopNotification[]>([])
    const addNotification = useCallback((notification: ITopNotification) => {
        setTopNotifications(topNotifications => {
            if (!topNotifications.find(existedNotification => existedNotification.id === notification.id)) {
                return [...topNotifications, notification]
            }
            return topNotifications
        })
    }, [])
    const removeNotification = useCallback((notificationId) => {
        setTopNotifications(topNotifications => topNotifications.filter(notification => notification.id !== notificationId))
    }, [])

    // console.log('topNotifications', topNotifications)

    const TopNotificationComponent: React.FC = () => {
        if (topNotifications.length === 0 && !serviceProblemsAlert) return null

        return (
            <>
                <Affix>
                    {serviceProblemsAlert}
                    {
                        topNotifications.map(notification => {
                            return (
                                <Alert
                                    banner
                                    showIcon
                                    message={notification.message}
                                    description={notification.description}
                                    type={notification.type}
                                    key={notification.id}
                                    action={
                                        <Space size={16}>
                                            {
                                                notification.actions.map((action, idx) => {
                                                    return (
                                                        <Button
                                                            onClick={async () => {
                                                                await action.action()

                                                                if (action.removeNotificationOnClick) {
                                                                    removeNotification(notification.id)
                                                                }
                                                            }}
                                                            type={action.secondary ? 'secondary' : 'primary'}
                                                            key={idx}
                                                        >
                                                            {action.title}
                                                        </Button>
                                                    )
                                                })}
                                        </Space>
                                    }
                                />
                            )
                        })
                    }
                </Affix>
            </>
        )
    }

    return {
        addNotification,
        removeNotification,
        TopNotificationComponent,
    }
}
