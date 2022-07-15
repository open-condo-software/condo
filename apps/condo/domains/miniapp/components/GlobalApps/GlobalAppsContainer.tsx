import React, { useRef, useEffect, useState, useCallback } from 'react'
import { notification } from 'antd'
import { useHotkeys } from 'react-hotkeys-hook'
import get from 'lodash/get'
import isObject from 'lodash/isObject'
import isFunction from 'lodash/isFunction'
import omit from 'lodash/omit'
import { v4 as uuidV4 } from 'uuid'
import { MutationEmitter, MUTATION_RESULT_EVENT } from '@core/next/apollo'
import { SortB2BAppsBy } from '@app/condo/schema'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import {
    IFRAME_MODAL_ACTION_MESSAGE_TYPE,
    NOTIFICATION_MESSAGE_TYPE,
    parseMessage,
    sendMessage,
} from '@condo/domains/common/utils/iframe.utils'
import { B2BApp } from '@condo/domains/miniapp/utils/clientSchema'
import GlobalIframe from './GlobalIframe'
import IFrameModal from '../IFrameModal'

type ModalInfo = {
    url: string
    closable: boolean
    ownerOrigin: string
}

const MUTATION_RESULT_MESSAGE_NAME = 'CondoWebUserEventResult'
const MODAL_OPEN_RESULT_MESSAGE_NAME = 'CondoWebOpenModalResult'
const MODAL_CLOSE_RESULT_MESSAGE_NAME = 'CondoWebCloseModalResult'

export const GlobalAppsContainer: React.FC = () => {
    const { objs } = B2BApp.useObjects({
        where: {
            isGlobal: true,
            isHidden: false,
        },
        sortBy: [SortB2BAppsBy.CreatedAtAsc],
    })

    const appUrls = objs.map(app => app.appUrl)
    const appOrigins = appUrls.map(extractOrigin)
    const iframeRefs = useRef<Array<HTMLIFrameElement>>([])
    const [modals, setModals] = useState<{ [id: string]: ModalInfo }>({})
    const [isDebug, setIsDebug] = useState(false)
    useHotkeys('d+e+b+u+g', () => setIsDebug(!isDebug), {}, [isDebug])

    useEffect(() => {
        iframeRefs.current = iframeRefs.current.slice(0, appUrls.length)
    }, [appUrls])

    const handleMutationResult = useCallback((payload) => {
        for (const iframe of iframeRefs.current) {
            const origin = extractOrigin(iframe.src)
            const targetWindow = get(iframe, 'contentWindow', null)
            if (origin && targetWindow) {
                sendMessage({
                    type: MUTATION_RESULT_MESSAGE_NAME,
                    data: payload,
                }, targetWindow, origin)
            }
        }
    }, [])

    // TODO(DOMA-3435, @savelevMatthew) Refactor message structure after moving to lib
    const handleNotification = useCallback((message) => {
        const notificationFunction = get(notification, message.notificationType)
        if (isFunction(notificationFunction)) {
            notificationFunction({ message: message.message })
        }
    }, [])

    const registerModal = useCallback((message, event) => {
        const id = uuidV4()
        setModals((prev) => ({
            ...prev,
            [id]: { url: message.url, closable: message.closable, ownerOrigin: event.origin },
        }))
        event.source.postMessage({
            type: MODAL_OPEN_RESULT_MESSAGE_NAME,
            data: { modalId: id },
        }, event.origin)
    }, [])

    const deleteModalFromApp = useCallback((id, event) => {
        if (modals[id]) {
            if (modals[id].ownerOrigin !== event.origin) {
                // TODO(DOMA-3435, @savelevMatthew) Send failure message here after moving to lib
            } else {
                setModals(omit(modals, id))
                event.source.postMessage({
                    type: MODAL_CLOSE_RESULT_MESSAGE_NAME,
                    data: { modalId: id, reason: 'commandMessage' },
                }, event.origin)
            }
        } else {
            // TODO(DOMA-3435, @savelevMatthew) Send failure message here after moving to lib
        }
    }, [modals])

    const deleteModalFromUser = useCallback((id) => {
        if (modals[id]) {
            setModals(omit(modals, id))
            for (const iframe of iframeRefs.current) {
                const targetOrigin = extractOrigin(iframe.src)
                const targetWindow = get(iframe, 'contentWindow', null)
                if (targetOrigin !== modals[id].ownerOrigin) continue
                if (targetWindow) {
                    sendMessage({
                        type: MODAL_CLOSE_RESULT_MESSAGE_NAME,
                        data: { modalId: id, reason: 'userAction' },
                    }, targetWindow, targetOrigin)
                }
            }
        }
    }, [modals])

    const handleMessage = useCallback((event: MessageEvent) => {
        if (!appOrigins.includes(event.origin)) return
        if (!event.data || !isObject(event.data)) return
        const parsedMessage = parseMessage(event.data)
        if (!parsedMessage) return
        const { type, message } = parsedMessage
        if (type === 'system') {
            switch (message.type) {
                case NOTIFICATION_MESSAGE_TYPE:
                    return handleNotification(message)
                case IFRAME_MODAL_ACTION_MESSAGE_TYPE:
                    if (message.action === 'open') {
                        return registerModal(message, event)
                    } else if (message.action === 'close') {
                        return deleteModalFromApp(message.modalId, event)
                    }

                    return
            }
        }
    }, [
        appOrigins,
        handleNotification,
        registerModal,
        deleteModalFromApp,
    ])

    useEffect(() => {
        MutationEmitter.on(MUTATION_RESULT_EVENT, handleMutationResult)
        return () => {
            MutationEmitter.off(MUTATION_RESULT_EVENT, handleMutationResult)
        }
    }, [handleMutationResult])

    useEffect(() => {
        window.addEventListener('message', handleMessage)

        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [handleMessage])

    return (
        <>
            {appUrls.map((url, index) => (
                <GlobalIframe
                    key={url}
                    pageUrl={url}
                    ref={el => iframeRefs.current[index] = el}
                    hidden={!isDebug}
                />
            ))}
            {Object.keys(modals).map((id) => (
                <IFrameModal
                    key={id}
                    id={id}
                    pageUrl={modals[id].url}
                    closable={modals[id].closable}
                    onClose={deleteModalFromUser}
                />
            ))}
        </>
    )
}