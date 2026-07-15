import { Spin } from 'antd'
import getConfig from 'next/config'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { IFrameMetadata } from '@open-condo/miniapp-utils/helpers/iframe'
import { buildAllowString } from '@open-condo/miniapp-utils/helpers/iframe'
import { usePostMessageContext } from '@open-condo/miniapp-utils/helpers/messaging'
import { getClientSideFingerprint } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { BasicEmptyListView, type IBasicEmptyListProps } from './EmptyListView'
import styles from './IFrame.module.css'

const { publicRuntimeConfig: { serverUrl } } = getConfig()

const DEFAULT_FRAME_HEIGHT = 700
const EMPTY_LIST_PROPS: IBasicEmptyListProps = {
    spaceSize: 16,
    image: '/mascot/waiting.webp',
    imageStyle: { marginBottom: 20 },
    containerStyle: { position: 'absolute', backgroundColor: 'var(--condo-global-color-white)' },
}

type IFrameRegisterEvent = {
    frameId: string
    frameRef: React.RefObject<HTMLIFrameElement>
    frameOrigin: string
}

type IFrameRegistrationCleanFn = () => void
type IFrameRegistrationHandler = (event: IFrameRegisterEvent) => IFrameRegistrationCleanFn | void
type IFrameReloadScope = 'user' | 'organization'

export type IFrameProps = {
    src: string
    hidden?: boolean
    metadata?: IFrameMetadata
    initialHeight?: number
    onRegister?: IFrameRegistrationHandler
    onLoad?: () => void
    prefetch?: boolean
    reloadScope?: IFrameReloadScope
}

const IFrame = React.memo<IFrameProps>(({
    src: propsSrc,
    hidden,
    metadata,
    initialHeight,
    onRegister,
    onLoad,
    prefetch = true,
    reloadScope = 'organization',
}) => {
    const intl = useIntl()
    const LoadingErrorOccurredTitle = intl.formatMessage({ id: 'miniapp.loadingError.title' })
    const LoadingErrorOccurredMessage = intl.formatMessage({ id: 'miniapp.loadingError.message' })

    const iframeRef = useRef<HTMLIFrameElement>(null)

    const [src, setSrc] = useState<string | undefined>(undefined)
    const [isFrameReady, setIsFrameReady] = useState(false)
    const [loading, setLoading] = useState(true)
    const [prefetchFailed, setPrefetchFailed] = useState(false)

    const { addFrame, removeFrame } = usePostMessageContext()

    const { user } = useAuth()
    const { organization } = useOrganization()

    const allowString = useMemo(() => buildAllowString(metadata?.permissions ?? {}), [metadata?.permissions])

    // NOTE: key will be used to force remount iframe when dependencies change
    const iframeKey = useMemo(() => {
        const keyParts = [propsSrc, intl.locale, user?.id]
        if (reloadScope === 'organization') {
            keyParts.push(organization?.id)
        }

        return keyParts.join(':')
    }, [intl.locale, organization?.id, propsSrc, reloadScope, user?.id])

    // Step 1. Init iframe element, obtain ref and register handlers first before loading page to avoid race conditions
    useEffect(() => {
        if (!iframeRef.current) return

        // NOTE: set initial height if not set
        if (!iframeRef.current.height) {
            iframeRef.current.height = `${initialHeight || DEFAULT_FRAME_HEIGHT}px`
        }

        const frameId = addFrame(iframeRef.current, metadata)
        const frameOrigin = new URL(propsSrc).origin

        const cleanFn = onRegister?.({ frameId, frameOrigin, frameRef: iframeRef })

        setIsFrameReady(true)

        return () => {
            if (cleanFn) {
                cleanFn()
            }
            removeFrame(frameId)
            setIsFrameReady(false)
            setSrc(undefined)
            setPrefetchFailed(false)
            setLoading(true)
        }
    // NOTE: include iframe key to force iframe registration on rerendering
    }, [addFrame, initialHeight, metadata, onRegister, propsSrc, removeFrame, iframeKey])

    const prefetchFn = useCallback(async (src: string) => {
        try {
            const response = await fetch(src, { method: 'HEAD', redirect: 'manual' })
            if (response.status >= 400) {
                setPrefetchFailed(true)
            }
        } catch {
            setPrefetchFailed(true)
        }
    }, [])

    // NOTE: Step 2. Prefetch iframe if necessary, then load the page by setting src attr after the iframe is initialized and handlers are registered
    useEffect(() => {
        if (!isFrameReady) return

        const u = new URL(propsSrc, serverUrl)
        u.searchParams.set('condoUserType', user?.type ?? 'staff')
        u.searchParams.set('condoContextEntity', 'Organization')
        u.searchParams.set('condoDeviceId', getClientSideFingerprint())
        if (user?.id) {
            u.searchParams.set('condoUserId', user.id)
        }
        if (organization?.id) {
            // TODO: remove this one day later, keeping for legacy reasons now
            u.searchParams.set('condoOrganizationId', organization.id)
            u.searchParams.set('condoContextEntityId', organization.id)
        }

        setSrc(u.toString())
        if (prefetch) {
            void prefetchFn(u.toString())
        }
    // NOTE: make sure optional chaining on user?.* and organization?.*. Its types are incorrect right now
    }, [isFrameReady, organization?.id, prefetch, prefetchFn, propsSrc, user?.id, user?.type])

    // NOTE: will be triggered only after src is set
    const handleLoad = useCallback(() => {
        setLoading(false)
        onLoad?.()
    }, [onLoad])

    return (
        <div className={styles.iframeContainer}>
            {!hidden && loading && !prefetchFailed && (<Spin size='large' className={styles.iframeLoader}/>)}
            {!hidden && prefetchFailed && (
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
                hidden={hidden}
                onLoad={handleLoad}
                allow={allowString}
                key={iframeKey}
                ref={iframeRef}
                className={styles.iframe}
                src={src}
                scrolling='no'
            />
        </div>
    )
})

IFrame.displayName = 'IFrame'

export { IFrame }