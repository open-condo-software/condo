import React from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { AmplitudeProvider as CoreAmplitudeProvider, Amplitude } from '@condo/domains/common/utils/amplitudeUtils'
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

// class AmplitudeInstance extends TrackerInstance {
//     public amplitudeInstance
//     public userId: string
//
//     constructor () {
//         const { publicRuntimeConfig: { amplitudeToken } } = getConfig()
//         super(amplitudeToken)
//     }
//
//     init () {
//         const amplitudeInstance = amplitude.getInstance()
//
//         const userId = getCurrentUserId()
//         this.userId = userId
//
//         amplitudeInstance.init(this.token, null, {
//             userId,
//             includeReferrer: true,
//             includeGclid: true,
//             includeUtm: true,
//         })
//
//         if (amplitudeInstance.isNewSession()) {
//             const visitor: Identify = new amplitudeInstance.Identify()
//             visitor.setOnce('userId', userId)
//             amplitudeInstance.identify(visitor)
//         }
//         this.amplitudeInstance = amplitudeInstance
//         return amplitudeInstance
//     }
//
//     getProvider (children: React.ReactChildren): React.ReactElement {
//         if (!this.token || typeof window === 'undefined') {
//             return <>{children}</>
//         }
//
//         return (
//             <CoreAmplitudeProvider amplitudeInstance={this.amplitudeInstance} apiKey={this.token} userId={this.userId}>
//                 <Amplitude eventProperties={{
//                     user: {
//                         sessionId: this.userId,
//                     },
//                 }}>
//                     {children}
//                 </Amplitude>
//             </CoreAmplitudeProvider>
//         )
//     }
// }

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
            <Amplitude
                eventProperties={{
                    page: {
                        path: asPath,
                    },
                }}
            >
                {children}
            </Amplitude>
        </CoreAmplitudeProvider>
    )
}

export default AmplitudeProvider
