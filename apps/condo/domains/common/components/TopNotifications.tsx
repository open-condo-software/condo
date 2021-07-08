/** @jsx jsx */
import { Button } from '@condo/domains/common/components/Button'
import { useState } from 'react'
import { Affix, Alert, AlertProps, Space } from 'antd'
import { InfoCircleFilled } from '@ant-design/icons'
import { css, jsx } from '@emotion/core'
import { colors } from '@condo/domains/common/constants/style'


const notificationAlert = css`
    border-bottom: 1px solid ${colors.white};
    height: 78px;
    & .anticon {
        color: ${colors.green[7]};
    }
    & .ant-alert-message {
        font-size: 20px;
        line-height: 28px;
        color: ${colors.green[7]};
    }
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
                                css={notificationAlert}
                                action={<Space size={20}> {
                                    notification.actions.map((action, idx) => {
                                        return (
                                            <Button
                                                onClick={async () => {
                                                    await action.action()
                                                    removeNotification(notification.id)
                                                }}
                                                size={'large'}
                                                type={'sberPrimary'}
                                                secondary={action.secondary}
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
