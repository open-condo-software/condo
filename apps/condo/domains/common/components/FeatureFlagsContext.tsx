import { useAuth } from '@condo/next/auth'
import { useOrganization } from '@condo/next/organization'
import { GrowthBook, GrowthBookProvider, useGrowthBook } from '@growthbook/growthbook-react'
import { get } from 'lodash'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { createContext, useCallback, useContext, useEffect } from 'react'

const {
    publicRuntimeConfig: {
        featureToggleConfig,
    },
} = getConfig()

const growthbook = new GrowthBook()

const FEATURES_ENDPOINT = `${get(featureToggleConfig, 'url')}/${get(featureToggleConfig, 'apiKey')}`

interface IFeatureFlagsContext {
    useFlag: (name: string) => boolean,
    updateContext: (context) => Promise<void>
}

const FeatureFlagsContext = createContext(null)

const useFeatureFlags = (): IFeatureFlagsContext => useContext(FeatureFlagsContext)

const FeatureFlagsProviderWrapper = ({ children }) => {
    const router = useRouter()
    const growthbook = useGrowthBook()

    const updateContext = useCallback((context) => {
        const previousContext = growthbook.getAttributes()

        growthbook.setAttributes({ ...previousContext, ...context })
    }, [growthbook])
    const useFlag = useCallback((id) => growthbook.feature(id).on, [growthbook])

    const { user } = useAuth()
    const { organization } = useOrganization()

    useEffect(() => {
        if (user) {
            updateContext({ userId: user.id })
        }
    }, [updateContext, user])

    useEffect(() => {
        if (organization) {
            updateContext({ organization: organization.id })
        }
    }, [organization, updateContext])

    useEffect(() => {
        fetch(FEATURES_ENDPOINT)
            .then((res) => res.json())
            .then((json) => {
                growthbook.setFeatures(json.features)
            })
    }, [growthbook, router.pathname])

    return (
        <FeatureFlagsContext.Provider value={{
            useFlag,
            updateContext,
        }}>
            {children}
        </FeatureFlagsContext.Provider>
    )
}

const FeatureFlagsProvider: React.FC = ({ children }) => {
    return (
        <GrowthBookProvider growthbook={growthbook}>
            <FeatureFlagsProviderWrapper>
                {children}
            </FeatureFlagsProviderWrapper>
        </GrowthBookProvider>
    )
}

export { useFeatureFlags, FeatureFlagsProvider }