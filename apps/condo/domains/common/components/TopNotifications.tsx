/** @jsx jsx */
import { InfoCircleFilled } from '@ant-design/icons'
import { css, jsx } from '@emotion/react'
import { Affix, Alert, AlertProps, Space } from 'antd'
import React, { useState } from 'react'

import { Button } from '@condo/domains/common/components/Button'
import { colors } from '@condo/domains/common/constants/style'

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
    id: string,
    actions: ITopNotificationAction[]
    message: string | JSX.Element
    type: AlertProps['type']
}

interface ITopNotificationHookResult {
    TopNotificationComponent: React.FC,
    addNotification: (notification: ITopNotification) => void,
}

export const useTopNotificationsHook = (): ITopNotificationHookResult => {
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
        if (topNotifications.length === 0) return null
        return (
            <>
                <Affix>{
                    topNotifications.map(notification => {
                        return (
                            <Alert
                                showIcon
                                icon={(<InfoCircleFilled />)}
                                message={notification.message}
                                type={notification.type}
                                key={notification.id}
                                css={notificationAlert({ isSmall: !breakpoints.TABLET_LARGE })}
                                action={<Space size={20}>
                                    {
                                        notification.actions.map((action, idx) => {
                                            return (
                                                <Button
                                                    onClick={async () => {
                                                        await action.action()
                                                        removeNotification(notification.id)
                                                    }}
                                                    size={!breakpoints.TABLET_LARGE ? 'middle' : 'large'}
                                                    type='sberPrimary'
                                                    secondary={action.secondary}
                                                    key={idx}
                                                >
                                                    {action.title}
                                                </Button>
                                            )
                                        })}
                                </Space>}
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
