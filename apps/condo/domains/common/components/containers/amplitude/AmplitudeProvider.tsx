import React from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'

import { AmplitudeProvider as CoreAmplitudeProvider, Amplitude } from 'react-amplitude-hooks'
import amplitude, { Identify } from 'amplitude-js'
import { getCurrentUserId } from '@condo/domains/common/utils/userid.utils'


export type BaseEventProperties = {
    page: {
        pathname: string
    },
    user: {
        userId: string
        locale: string
    }
}

const AmplitudeProvider: React.FC = ({ children }) => {
    const { publicRuntimeConfig: { amplitudeToken } } = getConfig()
    const { pathname, locale } = useRouter()

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
        visitor.setOnce('lang', locale)
        visitor.setOnce('userId', userId)
        amplitudeInstance.identify(visitor)
    }

    return (
        <CoreAmplitudeProvider amplitudeInstance={amplitudeInstance} apiKey={amplitudeToken} userId={userId}>
            <Amplitude eventProperties={{
                page: {
                    pathname,
                },
                user: {
                    sessionId: userId,
                    locale,
                },
            }}>
                {children}
            </Amplitude>
        </CoreAmplitudeProvider>
    )
}

export default AmplitudeProvider
