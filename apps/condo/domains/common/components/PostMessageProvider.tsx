import { notification } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { PostMessageProvider as DefaultProvider } from '@open-condo/miniapp-utils/helpers/messaging'
import type { NotificationsApi } from '@open-condo/miniapp-utils/helpers/messaging'

export const PostMessageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const router = useRouter()
    const [notificationsFunction, notificationsRoot] = notification.useNotification()

    const showNotification: NotificationsApi = useCallback((params) => {
        notificationsFunction[params.type]({
            message: params.message,
            description: params.description,
        })
    }, [notificationsFunction])

    return (
        <DefaultProvider
            notificationsApi={showNotification}
            router={router}
        >
            {children}
            {notificationsRoot}
        </DefaultProvider>
    )
}