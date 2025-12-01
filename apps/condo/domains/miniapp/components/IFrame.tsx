import get from 'lodash/get'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'
import { usePostMessageContext } from '@condo/domains/common/components/PostMessageProvider'
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
    allowFullscreen?: boolean
    onLoad?: () => void
}


const IFrameForwardRef = React.forwardRef<HTMLIFrameElement, IFrameProps>((props, ref) => {
    const {
        src,
        reloadScope,
        hidden = false,
        withLoader = false,
        withPrefetch = false,
        withResize = false,
        allowFullscreen = false,
        onLoad,
    } = props

    const intl = useIntl()
    const LoadingErrorOccurredTitle = intl.formatMessage({ id: 'miniapp.loadingError.title' })
    const LoadingErrorOccurredMessage = intl.formatMessage({ id: 'miniapp.loadingError.message' })

    // Inner ref needed for managing postMessages, outer for managing multiple frames
    const innerRef = useRef(null)
    const handleRefChange = useCallback((el: HTMLIFrameElement) => {
        if (typeof ref === 'function') {
            ref(el)
        }

        innerRef.current = el
    }, [ref])

    const [frameId, setFrameId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isError, setIsError] = useState(false)
    const [frameHeight, setFrameHeight] = useState(DEFAULT_FRAME_HEIGHT)
    const isClientSide = typeof window !== 'undefined'

    const { user } = useAuth()
    const { organization } = useOrganization()
    const { addFrame, addEventHandler, removeFrame } = usePostMessageContext()

    const userId = get(user, 'id', null)
    const organizationId = get(organization, 'id', null)
    const srcWithMeta = useMemo(() => {
        const url = new URL(src)
        if (userId && (reloadScope === 'user' || reloadScope === 'organization')) {
            url.searchParams.set('condoUserId', userId)
        }
        if (organizationId && reloadScope === 'organization') {
            url.searchParams.set('condoOrganizationId', organizationId)
        }

        return url.toString()
    }, [src, userId, organizationId, reloadScope])

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
        onLoad?.()
    }, [onLoad])

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

    const requestAuth = useCallback<RequestHandler<'CondoWebAppRequestAuth'>>(async ({ url }) => {
        const response = await fetch(url, { credentials: 'include' })
        const body = await response.text()

        return {
            response: { status: response.status, body, url: response.url },
        }
    }, [])

    useEffect(() => {
        if (withPrefetch) {
            preFetch()
        }
    }, [withPrefetch, preFetch])

    useEffect(() => {
        const srcOrigin = extractOrigin(src)
        if (srcOrigin) {
            const newFrameId = addFrame(innerRef)
            setFrameId(newFrameId)

            return () => {
                removeFrame(newFrameId)
                setFrameId(null)
            }
        }
    }, [src, addFrame, removeFrame])

    useEffect(() => {
        if (frameId && withResize) {
            addEventHandler('CondoWebAppResizeWindow', frameId, resizeFrame)
        }
    }, [frameId, withResize, addEventHandler, resizeFrame])

    useEffect(() => {
        if (frameId) {
            addEventHandler('CondoWebAppRequestAuth', frameId, requestAuth)
        }
    }, [frameId, addEventHandler, requestAuth])

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
                ref={handleRefChange}
                height={frameHeight}
                allowFullScreen={allowFullscreen}
                allow='clipboard-write'
                // NOTE: Deprecated, but overflow: hidden still not works in Chrome :)
                scrolling='no'
            />
        </>
    )
})

IFrameForwardRef.displayName = 'IFrame'

export const IFrame = React.memo(IFrameForwardRef)
