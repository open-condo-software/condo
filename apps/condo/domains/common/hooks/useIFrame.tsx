import React, { useEffect, useState } from 'react'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { parseMessage, REQUIREMENT_TYPE, NOTIFICATION_TYPE } from '@condo/domains/common/utils/iframe.utils'
import { useAuth } from '@core/next/auth'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { useOrganization } from '@core/next/organization'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { notification } from 'antd'
import { css } from 'emotion'
import get from 'lodash/get'
import { Loader } from '@condo/domains/common/components/Loader'

type useIFrameType = (pageUrl: string, options?: optionsType) => JSX.Element
type optionsType = {
    withLoader?: boolean,
}

const IFRAME_STYLES = ({ isLoading }) => css`
  visibility: ${isLoading ? 'hidden' : 'visible'};
  box-sizing: border-box;
  border: none;
`


export const useIFrame: useIFrameType = (pageUrl: string, options?: optionsType) => {
    const { isAuthenticated } = useAuth()
    const { organization } = useOrganization()

    const pageOrigin = extractOrigin(pageUrl)

    const [isLoading, setIsLoading] = useState(true)
    const [isAuthRequired, setIsAuthRequired] = useState(false)
    const [isOrganizationRequired, setIsOrganizationRequired] = useState(false)

    const handleMessage = (event) => {
        if (event.origin !== pageOrigin) return
        if (event.data && typeof event.data !== 'object') return
        const { message, errors } = parseMessage(event.data)
        // TODO(DOMA-1831) Send errors back to sender
        if (errors && errors.length) return
        if (!message) return
        if (message.type === REQUIREMENT_TYPE) handleRequirement(message)
        else if (message.type === NOTIFICATION_TYPE) handleNotification(message)

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

    const shouldHaveLoader = get(options, 'withLoader', true)

    return <>
        <Wrapper>
            { shouldHaveLoader && isLoading && <Loader fill size={'large'}/> }
            <iframe src={pageUrl} onLoad={handleLoad} css={IFRAME_STYLES({ isLoading })}/>
        </Wrapper>
    </>
}