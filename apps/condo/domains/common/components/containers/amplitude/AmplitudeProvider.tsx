import React from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'

import { AmplitudeProvider as CoreAmplitudeProvider, Amplitude } from 'react-amplitude-hooks'
import amplitude, { Identify } from 'amplitude-js'
import { getCurrentUserId } from '@condo/domains/common/utils/userid.utils'


export type BaseEventProperties = {
    page: {
        path: string
    }
    user: {
        sessionId: string
    }
}

export enum AmplitudeEventType {
    VisitBillingAppListPage = 'VisitBillingAppListPage',
    VisitBillingPage = 'VisitBillingPage',
    VisitBillingAboutPage = 'VisitBillingAboutPage',
    OpenDescriptionLink = 'OpenDescriptionLink',
}

const AmplitudeProvider: React.FC = ({ children }) => {
    const { publicRuntimeConfig: { amplitudeToken } } = getConfig()
    const { asPath } = useRouter()

    if (!amplitudeToken || typeof window === 'undefined') {
        return <>{children}</>
    }

    const userId = getCurrentUserId()

    const amplitudeInstance = amplitude.getInstance()
    amplitudeInstance.init(amplitudeToken, null, {
        userId,
        includeReferrer: true,
        includeGclid: true,
        includeUtm: true,
    })

    if (amplitudeInstance.isNewSession()) {
        const visitor: Identify = new amplitudeInstance.Identify()
        visitor.setOnce('userId', userId)
        amplitudeInstance.identify(visitor)
    }

    return (
        <CoreAmplitudeProvider amplitudeInstance={amplitudeInstance} apiKey={amplitudeToken} userId={userId}>
            <Amplitude eventProperties={{
                page: {
                    path: asPath,
                },
                user: {
                    sessionId: userId,
                },
            }}>
                {children}
            </Amplitude>
        </CoreAmplitudeProvider>
    )
}

export default AmplitudeProvider
