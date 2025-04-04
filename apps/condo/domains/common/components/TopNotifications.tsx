import { Affix, Space } from 'antd'
import React, { useCallback, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { Alert, Button, AlertProps } from '@open-condo/ui'


export interface ITopNotificationAction {
    action: () => Promise<void>
    title: string
    keepNotificationOnClick?: boolean
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
    const { user } = useAuth()
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

    const TopNotificationComponent: React.FC = () => {
        if (topNotifications.length === 0 && !serviceProblemsAlert) return null

        return (
            <>
                <Affix>
                    {serviceProblemsAlert}
                    {
                        !!user && topNotifications.map(notification => (
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
                                            notification.actions.map((action, idx) => (
                                                <Button
                                                    onClick={async () => {
                                                        await action.action()

                                                        if (!action.keepNotificationOnClick) {
                                                            removeNotification(notification.id)
                                                        }
                                                    }}
                                                    type={action.secondary ? 'secondary' : 'primary'}
                                                    key={idx}
                                                >
                                                    {action.title}
                                                </Button>
                                            ))
                                        }
                                    </Space>
                                }
                            />
                        ))
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
