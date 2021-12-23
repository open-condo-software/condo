import React, { CSSProperties, useEffect, useMemo, useState } from 'react'
import { notification } from 'antd'
import get from 'lodash/get'

import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'

import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import {
    parseMessage,
    REQUIREMENT_MESSAGE_TYPE,
    NOTIFICATION_MESSAGE_TYPE,
    LOADED_STATUS_MESSAGE_TYPE,
    sendError,
} from '@condo/domains/common/utils/iframe.utils'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Loader } from '@condo/domains/common/components/Loader'

interface IFrameProps {
    pageUrl: string
    options?: optionsType
}
type optionsType = {
    withLoader?: boolean,
}

const getIframeStyles: (boolean) => CSSProperties = (isLoading) => ({
    visibility: isLoading ? 'hidden' : 'visible',
})

export const IFrame: React.FC<IFrameProps> = (props) => {
    const { pageUrl, options } = props
    const { isAuthenticated, user } = useAuth()
    const { organization } = useOrganization()

    const pageOrigin = extractOrigin(pageUrl)

    const [isLoading, setIsLoading] = useState(true)
    const [isAuthRequired, setIsAuthRequired] = useState(false)
    const [isOrganizationRequired, setIsOrganizationRequired] = useState(false)

    // NOTE: Changing this will trigger iframe reload
    // By default used to reload after user / organization changes
    const iframeKey = `${get(user, 'id', null)}:${get(organization, 'id', null)}`

    const handleMessage = (event) => {
        if (event.origin !== pageOrigin) return
        if (event.data && typeof event.data !== 'object') return
        const { message, errors } = parseMessage(event.data)
        if (errors && errors.length) {
            errors.forEach(error => {
                sendError(error, event.data, event.source, event.origin)
            })
        }
        if (!message) return
        if (message.type === REQUIREMENT_MESSAGE_TYPE) handleRequirement(message)
        else if (message.type === NOTIFICATION_MESSAGE_TYPE) handleNotification(message)
        else if (message.type === LOADED_STATUS_MESSAGE_TYPE) handleLoad()
    }

    const handleRequirement = (message) => {
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
    }

    const handleNotification = (message) => {
        switch (message.notificationType) {
            case 'info':
                notification.info({ message: message.message })
                break
            case 'warning':
                notification.warning({ message: message.message })
                break
            case 'error':
                notification.error({ message: message.message })
                break
            case 'success':
                notification.success({ message: message.message })
                break
        }
    }

    const handleLoad = () => {
        setIsLoading(false)
    }

    let Wrapper: React.FC = React.Fragment
    if (!isAuthenticated && isAuthRequired) Wrapper = AuthRequired
    if (!organization && isOrganizationRequired) Wrapper = OrganizationRequired

    useEffect(() => {
        window.addEventListener('message', handleMessage, false)

        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [])

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
            />
        </Wrapper>
    </>
}