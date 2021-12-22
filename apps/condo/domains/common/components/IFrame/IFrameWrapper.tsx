import React, { useEffect } from 'react'
import { sendLoadedStatus, sendRequirementRequest } from '@condo/domains/common/utils/iframe.utils'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import getConfig from 'next/config'

interface IFrameWrapperProps {
    withOrganization?: boolean
    withUser?: boolean
    parentOrigin?: string
}

const { publicRuntimeConfig: { serverUrl } } = getConfig()

export const IFrameWrapper: React.FC<IFrameWrapperProps> = (props) => {
    const { withUser, withOrganization, parentOrigin: propParentOrigin } = props
    const parentOrigin = propParentOrigin ? propParentOrigin : serverUrl
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


    return (
        <>
            {props.children}
        </>
    )
}