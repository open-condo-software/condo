import { notification } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import type { ShowModalWindowParams } from '@open-condo/bridge'
import { IFRAME_METADATA_SCHEMA } from '@open-condo/miniapp-utils/helpers/iframe'
import type { IFrameMetadata } from '@open-condo/miniapp-utils/helpers/iframe'
import { PostMessageProvider as DefaultProvider } from '@open-condo/miniapp-utils/helpers/messaging'
import type { NotificationsApi, ModalsApi } from '@open-condo/miniapp-utils/helpers/messaging'
import { generateUUIDv4 } from '@open-condo/miniapp-utils/helpers/uuid'
import { Modal } from '@open-condo/ui'

import { B2BAppFrame } from '@condo/domains/miniapp/components/B2BAppFrame'
import { MiniappModalProvider } from '@condo/domains/miniapp/components/MiniappModalContext'

export const PostMessageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const router = useRouter()
    const [notificationsFunction, notificationsRoot] = notification.useNotification()
    const [modalsFunction, modalsRoot] = Modal.useModal()

    const showNotification: NotificationsApi = useCallback((params) => {
        notificationsFunction[params.type]({
            message: params.message,
            description: params.description,
        })
    }, [notificationsFunction])

    const showModal: ModalsApi = useCallback((params) => {
        const { success, data: parsedMetadata } = IFRAME_METADATA_SCHEMA.safeParse(params.metadata)

        return modalsFunction({
            title: params.title,
            children: <B2BAppFrame
                src={params.url}
                metadata={success ? parsedMetadata : undefined}
                initialHeight={params.initialHeight}
            />,
            width: params.size,
            onCancel: params.onCancel,
        })
    }, [modalsFunction])

    const openMiniappModal = useCallback((params: ShowModalWindowParams & { metadata?: IFrameMetadata }) => {
        const { success, data: parsedMetadata } = IFRAME_METADATA_SCHEMA.safeParse(params.metadata)
        const url = new URL(params.url)
        url.searchParams.set('modalId', generateUUIDv4())

        const modalActionsRef: { current: ReturnType<typeof modalsFunction> | null } = { current: null }
        const onClose = () => modalActionsRef.current?.destroy()
        modalActionsRef.current = modalsFunction({
            title: params.title,
            children: <B2BAppFrame
                src={url.toString()}
                metadata={success ? parsedMetadata : undefined}
                initialHeight={params.initialHeight}
                onCloseModal={onClose}
            />,
            width: params.size,
        })
    }, [modalsFunction])

    return (
        <MiniappModalProvider value={openMiniappModal}>
            <DefaultProvider
                notificationsApi={showNotification}
                modalsApi={showModal}
                router={router}
            >
                {children}
                {notificationsRoot}
                {modalsRoot}
            </DefaultProvider>
        </MiniappModalProvider>
    )
}