/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import { Affix, AlertProps, Space } from 'antd'
import React, { useState } from 'react'

import { Info } from '@open-condo/icons'
import { Alert, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { useLayoutContext } from './LayoutContext'


const notificationAlert = ({ isSmall }) => css`
    border-bottom: 1px solid ${colors.white};
    height: ${isSmall ? 'auto' : '78px'};
    & .anticon {
        color: ${colors.green[7]};
    }
    & .ant-alert-message {
        font-size: 20px;
        line-height: 28px;
        color: ${colors.green[7]};
    }
    ${isSmall && `
        flex-wrap: wrap;
        & .ant-alert-action {
            width: 100%;
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
    `}
`

export interface ITopNotificationAction {
    action: () => Promise<void>
    title: string
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
}

export const useTopNotificationsHook = (serviceProblemsAlert?: React.ReactNode): ITopNotificationHookResult => {
    const [topNotifications, setTopNotifications] = useState<ITopNotification[]>([])
    const addNotification = (notification: ITopNotification) => {
        if (!topNotifications.find(existedNotification => existedNotification.id === notification.id)) {
            setTopNotifications([...topNotifications, notification])
        }
    }
    const removeNotification = (notificationId) => {
        setTopNotifications([...topNotifications.filter(notification => notification.id !== notificationId)])
    }

    const TopNotificationComponent: React.FC = () => {
        const { breakpoints } = useLayoutContext()

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
                                                                removeNotification(notification.id)
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
        TopNotificationComponent,
    }
}
