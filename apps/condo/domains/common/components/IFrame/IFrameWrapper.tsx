import React, { useEffect } from 'react'
import { sendLoadedStatus, sendRequirementRequest } from './utils'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'

interface IFrameWrapperProps {
    withOrganization?: boolean
    withUser?: boolean
}

export const IFrameWrapper: React.FC<IFrameWrapperProps> = (props) => {
    const { withUser, withOrganization } = props
    const parentType = typeof parent
    const { isAuthenticated } = useAuth()
    const { organization } = useOrganization()

    useEffect(() => {
        // NOTE: Sending load info manually for Safari support, in which iframe.onload sometimes doesn't trigger
        sendLoadedStatus()
    }, [parentType])

    useEffect(() => {
        if (withOrganization && !organization) sendRequirementRequest('organization')
    }, [parentType, organization, withOrganization])

    useEffect(() => {
        if (withUser && !isAuthenticated) sendRequirementRequest('auth')
    }, [parentType, isAuthenticated, withUser])


    return (
        <>
            {props.children}
        </>
    )
}