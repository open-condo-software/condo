import get from 'lodash/get'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'
import { usePostMessageContext } from '@condo/domains/common/components/PostMessageProvider'
import {
    parseMessage,
    RESIZE_MESSAGE_TYPE,
} from '@condo/domains/common/utils/iframe.utils'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'

import type { IBasicEmptyListProps } from '@condo/domains/common/components/EmptyListView'
import type { RequestHandler } from '@condo/domains/common/components/PostMessageProvider/types'


const DEFAULT_FRAME_HEIGHT = 700

const EMPTY_LIST_PROPS: IBasicEmptyListProps = {
    spaceSize: 16,
    image: '/dino/waiting@2x.png',
    imageStyle: { marginBottom: 20 },
}

const IFRAME_STYLES: CSSProperties = {
    width: '100%',
    border: 'none',
    overflow: 'hidden',
}
export type IFrameProps = {
    src: string
    hidden?: boolean
    reloadScope: 'user' | 'organization' | null
    withLoader?: boolean
    withPrefetch?: boolean
    withResize?: boolean
}


const IFrameForwardRef = React.forwardRef<HTMLIFrameElement, IFrameProps>((props, ref) => {
    const {
        src,
        reloadScope,
        hidden = false,
        withLoader = false,
        withPrefetch = false,
        withResize = false,
    } = props

    const intl = useIntl()
    const LoadingErrorOccurredTitle = intl.formatMessage({ id: 'miniapp.loadingError.title' })
    const LoadingErrorOccurredMessage = intl.formatMessage({ id: 'miniapp.loadingError.message' })

    const [isLoading, setIsLoading] = useState(true)
    const [isError, setIsError] = useState(false)
    const [frameHeight, setFrameHeight] = useState(DEFAULT_FRAME_HEIGHT)
    const isClientSide = typeof window !== 'undefined'

    const { user } = useAuth()
    const { organization } = useOrganization()
    const { addOrigin, addEventHandler, removeOrigin } = usePostMessageContext()

    const userId = get(user, 'id', null)
    const organizationId = get(organization, 'id', null)
    const srcWithMeta = useMemo(() => {
        const url = new URL(src)
        if (userId) {
            url.searchParams.set('condoUserId', userId)
        }
        if (organizationId) {
            /**
             * @deprecated
             * TODO(DOMA-5142): notify developers about change, then remove organizationId
             * Why? We can pass sign some parameters and sign user info with key, similar to checksum
             * So if you don't need condo backend, you can just compare this checksum by yourself and trust it (use as success auth)
             * To compute checksum, you need to know which parameters to include, that's why it should be marked (with condo prefix)
             * And parameters not included in sum are not marked
             */
            url.searchParams.set('organizationId', organizationId)
            url.searchParams.set('condoOrganizationId', organizationId)
        }

        return url.toString()
    }, [src, userId, organizationId])

    const rerenderKey = useMemo(() => {
        const params: { [key: string]: string } = { src }
        if (reloadScope === 'user') {
            params.user = String(userId)
        } else if (reloadScope === 'organization') {
            params.user = String(userId)
            params.org = String(organizationId)
        }

        return Object.entries(params).map(([key, value]) => `${key}:${value}`).join(';')
    }, [src, reloadScope, userId, organizationId])

    const handleLoad = useCallback(() => {
        setIsLoading(false)
    }, [])

    const preFetch = useCallback(async () => {
        if (isClientSide) {
            try {
                const response = await fetch(src, { method: 'HEAD', redirect: 'manual' })
                if (response.status >= 400) {
                    setIsError(true)
                }
            } catch {
                setIsError(true)
            }
        }
    }, [isClientSide, src])
    
    const resizeFrame = useCallback<RequestHandler<'CondoWebAppResizeWindow'>>(({ height }) => {
        setFrameHeight(height)
        return { height }
    }, [])

    useEffect(() => {
        if (withPrefetch) {
            preFetch()
        }
    }, [withPrefetch, preFetch])
    
    useEffect(() => {
        const srcOrigin = extractOrigin(src)
        if (srcOrigin) {
            addOrigin(srcOrigin)

            if (withResize) {
                addEventHandler('CondoWebAppResizeWindow', srcOrigin, resizeFrame)
            }

            return () => removeOrigin(srcOrigin)
        }
    }, [src, withResize, addOrigin, removeOrigin, addEventHandler, resizeFrame])

    /**
     * @deprecated
     * TODO(DOMA-5142): notify developers about change, then remove this legacy listener
     */
    const handleMessage = useCallback((event: MessageEvent) => {
        if (event.origin !== extractOrigin(src)) return
        if (event.data && typeof event.data !== 'object') return
        const parsedMessage = parseMessage(event.data)
        if (!parsedMessage) return
        const { type, message } = parsedMessage
        if (type === 'system' && message.type === RESIZE_MESSAGE_TYPE) {
            setFrameHeight(message.height)
        }

    }, [src])

    useEffect(() => {
        if (withResize && isClientSide) {
            window.addEventListener('message', handleMessage)
            return () => window.removeEventListener('message', handleMessage)
        }
    }, [withResize, isClientSide, handleMessage])
    // END OF DEPRECATED ZONE

    return (
        <>
            {withLoader && isLoading && (
                <Loader fill size='large'/>
            )}
            {withPrefetch && isError && (
                <BasicEmptyListView {...EMPTY_LIST_PROPS}>
                    <Typography.Title level={4}>
                        {LoadingErrorOccurredTitle}
                    </Typography.Title>
                    <Typography.Text type='secondary'>
                        {LoadingErrorOccurredMessage}
                    </Typography.Text>
                </BasicEmptyListView>
            )}
            <iframe
                src={srcWithMeta}
                key={rerenderKey}
                style={IFRAME_STYLES}
                onLoad={handleLoad}
                hidden={isLoading || isError || hidden}
                ref={ref}
                height={frameHeight}
                // NOTE: Deprecated, but overflow: hidden still not works in Chrome :)
                scrolling='no'
            />
        </>
    )
})

IFrameForwardRef.displayName = 'IFrame'

export const IFrame = React.memo(IFrameForwardRef)
