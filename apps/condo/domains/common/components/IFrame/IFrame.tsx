import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { notification, Typography } from 'antd'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import Router from 'next/router'

import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'

import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import {
    parseMessage,
    REQUIREMENT_MESSAGE_TYPE,
    NOTIFICATION_MESSAGE_TYPE,
    LOADED_STATUS_MESSAGE_TYPE,
    RESIZE_MESSAGE_TYPE,
    COMMAND_MESSAGE_TYPE,
    REDIRECT_MESSAGE_TYPE,
} from '@condo/domains/common/utils/iframe.utils'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Loader } from '@condo/domains/common/components/Loader'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import getConfig from 'next/config'
import { JAVASCRIPT_URL_XSS } from '@condo/domains/common/constants/regexps'

type HandlerType = (message: Record<string, unknown>) => void

interface IFrameProps {
    pageUrl: string
    options?: optionsType
    handlers?: Array<HandlerType>
}

type optionsType = {
    withLoader?: boolean,
    withPreFetch?: boolean
}

const getIframeStyles: (boolean) => CSSProperties = (isLoading) => ({
    visibility: isLoading ? 'hidden' : 'visible',
    width: '100%',
})

const EMPTY_VIEW_IMAGE_STYLE: CSSProperties = { marginBottom: 20 }
const { publicRuntimeConfig: { serverUrl: serverOrigin } } = getConfig()

export const IFrame: React.FC<IFrameProps> = (props) => {
    const intl = useIntl()
    const LoadingErrorTitle = intl.formatMessage({ id: 'miniapp.loadingError.title' })
    const LoadingErrorMessage = intl.formatMessage({ id: 'miniapp.loadingError.message' })

    const { pageUrl, options, handlers } = props
    const shouldHaveLoader = get(options, 'withLoader', true)
    const shouldPrefetch = get(options, 'withPreFetch', true)

    const iFrameRef = useRef()
    const messageHandlers = useMemo(() => {
        return handlers ? handlers : []
    }, [handlers])

    const { isAuthenticated, user } = useAuth()
    const { organization } = useOrganization()

    const pageOrigin = extractOrigin(pageUrl)
    const isOnClient = typeof window !== 'undefined'

    const [isLoading, setIsLoading] = useState(true)
    const [isAuthRequired, setIsAuthRequired] = useState(false)
    const [isOrganizationRequired, setIsOrganizationRequired] = useState(false)
    const [isError, setIsError] = useState(false)

    const [frameHeight, setFrameHeight] = useState(300)

    // NOTE: Changing this will trigger iframe reload
    // By default used to reload after user / organization changes
    const condoUserId = get(user, 'id', null)
    const organizationId = get(organization, 'id', null)
    const iframeKey = `${condoUserId}:${organizationId}`
    const pageUrlWithParams = useMemo(() => {
        const url = new URL(pageUrl)
        if (condoUserId) {
            url.searchParams.set('condoUserId', condoUserId)
        }
        if (organizationId) {
            url.searchParams.set('organizationId', organizationId)
        }
        return url.toString()
    }, [pageUrl, condoUserId, organizationId])

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

    const handleRedirect = useCallback((message) => {
        if (!message.url) return null
        if (!message.url.startsWith(serverOrigin) && !message.url.startsWith('/')) return null
        if (message.url.match(JAVASCRIPT_URL_XSS)) return null
        return Router.push(message.url)
    }, [])

    useEffect(() => {
        const preFetch = async () => {
            if (isOnClient) {
                try {
                    const result = await fetch(pageUrl, { method: 'HEAD', redirect: 'manual' })
                    if (result.status >= 400) {
                        setIsError(true)
                    }
                } catch {
                    setIsError(true)
                }
            }
        }

        if (shouldPrefetch) {
            preFetch()
        }
    }, [isOnClient, pageUrl, shouldPrefetch])

    const handleCommand = useCallback((message) => {
        const iFrameReceiver = get(iFrameRef, 'current.contentWindow', null)
        switch (message.command) {
            case 'getOrganization':
                if (iFrameReceiver) {
                    iFrameReceiver.postMessage({ id: message.id, data: organization }, pageOrigin)
                }
                break
            case 'getUser':
                if (iFrameReceiver) {
                    iFrameReceiver.postMessage({ id: message.id, data: user }, pageOrigin)
                }
                break
        }
    }, [organization, user, pageOrigin])

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
                case COMMAND_MESSAGE_TYPE:
                    return handleCommand(message)
                case REDIRECT_MESSAGE_TYPE:
                    return handleRedirect(message)
            }
        } else {
            for (const handler of messageHandlers) {
                handler(message)
            }
        }
    }, [
        handleRedirect,
        handleCommand,
        handleLoad,
        handleNotification,
        handleRequirement,
        pageOrigin,
        handleResize,
        messageHandlers,
    ])

    let Wrapper: React.FC = React.Fragment
    if (!isAuthenticated && isAuthRequired) Wrapper = AuthRequired
    if (!organization && isOrganizationRequired) Wrapper = OrganizationRequired

    useEffect(() => {
        window.addEventListener('message', handleMessage)

        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [handleMessage])

    useEffect(() => {
        setIsLoading(true)
    }, [iframeKey])
    const styles = useMemo(() => getIframeStyles(isLoading), [isLoading])
    return (
        <Wrapper>
            {shouldHaveLoader && isLoading && <Loader fill size={'large'}/>}
            {isError && (
                <BasicEmptyListView
                    image={'/dino/waiting@2x.png'}
                    spaceSize={16}
                    imageStyle={EMPTY_VIEW_IMAGE_STYLE}
                >
                    <Typography.Title level={4}>
                        {LoadingErrorTitle}
                    </Typography.Title>
                    <Typography.Text type={'secondary'}>
                        {LoadingErrorMessage}
                    </Typography.Text>
                </BasicEmptyListView>
            )}
            <iframe
                src={pageUrlWithParams}
                style={styles}
                onLoad={handleLoad}
                key={iframeKey}
                frameBorder={0}
                height={frameHeight}
                scrolling={'no'}
                ref={iFrameRef}
                hidden={isError}
            />
        </Wrapper>
    )
}
