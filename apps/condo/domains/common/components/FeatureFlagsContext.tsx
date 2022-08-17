import getConfig from 'next/config'
import React, { createContext, useContext, useEffect } from 'react'
import { useAuth } from '@condo/next/auth'
import { useOrganization } from '@condo/next/organization'
import FlagProvider, { useUnleashContext, useFlag, useFlagsStatus } from '@unleash/proxy-client-react'

const {
    publicRuntimeConfig: {
        unleashProxyUrl,
        unleashProxyClientKey,
        unleashAppName,
        env,
    },
} = getConfig()

const config = {
    url: unleashProxyUrl,
    clientKey: unleashProxyClientKey,
    refreshInterval: 5,
    appName: unleashAppName,
    environment: env,
}

interface IFeatureFlagsContext {
    useFlag: (name: string) => boolean,
    useFlagsStatus: () => {
        flagsReady: boolean;
        flagsError: any;
    },
    updateContext: (context) => Promise<void>
}

const FeatureFlagsContext = createContext(null)

const useFeatureFlags = (): IFeatureFlagsContext => useContext(FeatureFlagsContext)

const FeatureFlagsProviderWrapper = ({ children }) => {
    const updateContext = useUnleashContext()

    const { user } = useAuth()
    const { organization } = useOrganization()

    useEffect(() => {
        if (user) {
            updateContext({ userId: user.id })
        }
    }, [updateContext, user])

    useEffect(() => {
        if (organization) {
            updateContext({ properties: { organization: organization.id } })
        }
    }, [organization, updateContext])

    return (
        <FeatureFlagsContext.Provider value={{ useFlag, useFlagsStatus, updateContext }}>
            {children}
        </FeatureFlagsContext.Provider>
    )
}

const FeatureFlagsProvider: React.FC = ({ children }) => {
    return (
        <FlagProvider config={config}>
            <FeatureFlagsProviderWrapper>
                {children}
            </FeatureFlagsProviderWrapper>
        </FlagProvider>
    )
}

export { useFeatureFlags, FeatureFlagsProvider }