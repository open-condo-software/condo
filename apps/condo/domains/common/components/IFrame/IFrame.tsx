import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { notification } from 'antd'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'

import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'

import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import {
    parseMessage,
    REQUIREMENT_MESSAGE_TYPE,
    NOTIFICATION_MESSAGE_TYPE,
    LOADED_STATUS_MESSAGE_TYPE,
    RESIZE_MESSAGE_TYPE,
} from '@condo/domains/common/utils/iframe.utils'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Loader } from '@condo/domains/common/components/Loader'

type HandlerType = (message: Record<string, unknown>) => void

interface IFrameProps {
    pageUrl: string
    options?: optionsType
    handlers?: Array<HandlerType>
}
type optionsType = {
    withLoader?: boolean,
}

const getIframeStyles: (boolean) => CSSProperties = (isLoading) => ({
    visibility: isLoading ? 'hidden' : 'visible',
    width: '100%',
})

export const IFrame: React.FC<IFrameProps> = (props) => {
    const { pageUrl, options, handlers } = props
    const messageHandlers = useMemo(() => {
        return handlers ? handlers : []
    }, [handlers])

    const { isAuthenticated, user } = useAuth()
    const { organization } = useOrganization()

    const pageOrigin = extractOrigin(pageUrl)

    const [isLoading, setIsLoading] = useState(true)
    const [isAuthRequired, setIsAuthRequired] = useState(false)
    const [isOrganizationRequired, setIsOrganizationRequired] = useState(false)

    const [frameHeight, setFrameHeight] = useState(300)

    // NOTE: Changing this will trigger iframe reload
    // By default used to reload after user / organization changes
    const iframeKey = `${get(user, 'id', null)}:${get(organization, 'id', null)}`

    const handleRequirement = useCallback((message) => {
        switch (message.requirement) {
            case 'auth':
                if (!isAuthenticated) {
                    setIsAuthRequired(true)
                }
                break
            case 'organization':
                if (!organization) {
                    setIsOrganizationRequired(true)
                }
                break
        }
    }, [isAuthenticated, organization])

    const handleNotification = useCallback((message) => {
        if (notification.hasOwnProperty(message.notificationType) && isFunction(notification[message.notificationType])) {
            notification[message.notificationType]({ message: message.message })
        }
    }, [])

    const handleLoad = useCallback(() => {
        setIsLoading(false)
    }, [])

    const handleResize = useCallback((message) => {
        setFrameHeight(message.height)
    }, [])

    const handleMessage = useCallback((event) => {
        if (event.origin !== pageOrigin) return
        if (event.data && typeof event.data !== 'object') return
        const parsedMessage = parseMessage(event.data)
        if (!parsedMessage) return
        const { type, message } = parsedMessage
        if (type === 'system') {
            switch (message.type) {
                case REQUIREMENT_MESSAGE_TYPE:
                    return handleRequirement(message)
                case NOTIFICATION_MESSAGE_TYPE:
                    return handleNotification(message)
                case LOADED_STATUS_MESSAGE_TYPE:
                    return handleLoad()
                case RESIZE_MESSAGE_TYPE:
                    return handleResize(message)
            }
        } else {
            for (const handler of messageHandlers) {
                handler(message)
            }
        }
    }, [handleLoad, handleNotification, handleRequirement, pageOrigin, handleResize, messageHandlers])

    let Wrapper: React.FC = React.Fragment
    if (!isAuthenticated && isAuthRequired) Wrapper = AuthRequired
    if (!organization && isOrganizationRequired) Wrapper = OrganizationRequired

    useEffect(() => {
        window.addEventListener('message', handleMessage, false)

        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [handleMessage])

    useEffect(() => {
        setIsLoading(true)
    }, [iframeKey])

    const shouldHaveLoader = get(options, 'withLoader', true)
    const styles = useMemo(() => getIframeStyles(isLoading), [isLoading])
    return <>
        <Wrapper>
            { shouldHaveLoader && isLoading && <Loader fill size={'large'}/> }
            <iframe
                src={pageUrl}
                onLoad={handleLoad}
                style={styles}
                key={iframeKey}
                frameBorder={0}
                height={frameHeight}
                scrolling={'no'}
            />
        </Wrapper>
    </>
}