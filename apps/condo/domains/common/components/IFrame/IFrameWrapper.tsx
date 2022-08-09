import React, { useEffect } from 'react'
import { css, Global } from '@emotion/react'
import { useAuth } from '@condo/next/auth'
import { useOrganization } from '@condo/next/organization'
import getConfig from 'next/config'
import { sendLoadedStatus, sendRequirementRequest, sendSize } from '@condo/domains/common/utils/iframe.utils'

interface IFrameWrapperProps {
    withOrganization?: boolean
    withUser?: boolean
    parentOrigin?: string
}

const BODY_RESIZE_STYLES = css`
  body {
    height: auto;
  }
`

const { publicRuntimeConfig: { condoUrl } } = getConfig()

export const IFrameWrapper: React.FC<IFrameWrapperProps> = (props) => {
    const { withUser, withOrganization, parentOrigin: propParentOrigin } = props
    const parentOrigin = propParentOrigin ? propParentOrigin : condoUrl
    const parentType = typeof parent
    const { isAuthenticated } = useAuth()
    const { organization } = useOrganization()

    useEffect(() => {
        // NOTE: Sending load info manually for Safari support, in which iframe.onload sometimes doesn't trigger
        if (parentType) {
            sendLoadedStatus(parent, parentOrigin)
        }
    }, [parentType, parentOrigin])

    useEffect(() => {
        if (withOrganization && !organization && parentType) {
            sendRequirementRequest('organization', parent, parentOrigin)
        }
    }, [parentType, organization, withOrganization, parentOrigin])

    useEffect(() => {
        if (withUser && !isAuthenticated) {
            sendRequirementRequest('auth', parent, parentOrigin)
        }
    }, [parentType, isAuthenticated, withUser, parentOrigin])

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            if (parentType && entries && entries.length) {
                sendSize(entries[0].target.clientHeight, parent, parentOrigin)
            }
        })
        observer.observe(document.body)
        return () => {
            observer.unobserve(document.body)
        }
    }, [parentOrigin, parentType])


    return (
        <>
            <Global styles={BODY_RESIZE_STYLES}/>
            {props.children}
        </>
    )
}