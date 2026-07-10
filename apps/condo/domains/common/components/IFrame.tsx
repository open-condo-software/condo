import getConfig from 'next/config'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import type { IFrameMetadata } from '@open-condo/miniapp-utils/helpers/iframe'
import { buildAllowString } from '@open-condo/miniapp-utils/helpers/iframe'
import { usePostMessageContext } from '@open-condo/miniapp-utils/helpers/messaging'
import { getClientSideFingerprint } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import styles from './IFrame.module.css'

const { publicRuntimeConfig: { serverUrl } } = getConfig()

const DEFAULT_FRAME_HEIGHT = 700

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
    reloadScope?: IFrameReloadScope
    initialHeight?: number
    metadata?: IFrameMetadata
    onRegister?: IFrameRegistrationHandler
}

const IFrame = React.memo<IFrameProps>(({
    src: propsSrc,
    metadata,
    initialHeight,
    onRegister,
    reloadScope = 'organization',
}) => {
    const intl = useIntl()
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const [src, setSrc] = useState<string | undefined>(undefined)
    const [isFrameReady, setIsFrameReady] = useState(false)
    // const [loading, setLoading] = useState(true)

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
        }
    }, [addFrame, initialHeight, metadata, onRegister, propsSrc, removeFrame])

    // NOTE: Step 2. Load the page by setting src attr after the iframe is initialized and handlers are registered
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
    }, [isFrameReady, organization?.id, propsSrc, user?.id, user?.type])

    return (
        <div>
            <iframe
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