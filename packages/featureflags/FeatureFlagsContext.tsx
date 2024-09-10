import { GrowthBook, GrowthBookProvider, useGrowthBook, FeaturesReady } from '@growthbook/growthbook-react'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import { NextPage } from 'next'
import getConfig from 'next/config'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import {
    DEBUG_RERENDERS,
    DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER,
    getContextIndependentWrappedInitialProps,
    preventInfinityLoop,
} from '@open-condo/next/_utils'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'


const {
    publicRuntimeConfig: {
        serverUrl,
    },
} = getConfig()

const growthbook = new GrowthBook()
const FEATURES_RE_FETCH_INTERVAL_IN_MS = 60 * 1000 // 1 min

type UseFlagValueType = <T>(name: string) => T | null

interface IFeatureFlagsContext {
    useFlag: (name: string) => boolean
    useFlagValue: UseFlagValueType
    updateContext: (context) => void
}

const FeatureFlagsContext = createContext<IFeatureFlagsContext>({
    useFlag: () => false,
    useFlagValue: () => null,
    updateContext: () => ({}),
})

const useFeatureFlags = (): IFeatureFlagsContext => useContext(FeatureFlagsContext)

const FeatureFlagsProviderWrapper = ({ children, initFeatures = null }) => {
    const growthbook = useGrowthBook()
    const { user, isLoading: userIsLoading  } = useAuth()
    const { organization, isLoading: organizationIsLoading } = useOrganization()
    const [features, setFeature] = useState(initFeatures)

    const isSupport = get(user, 'isSupport', false)
    const isAdmin = get(user, 'isAdmin', false)
    const userId = get(user, 'id', null)

    const updateContext = useCallback((context) => {
        const previousContext = growthbook.getAttributes()

        growthbook.setAttributes({ ...previousContext, ...context })
    }, [growthbook])
    const useFlag = useCallback((id) => growthbook.feature(id).on, [growthbook])
    const useFlagValue: UseFlagValueType = useCallback((id) => growthbook.feature(id).value, [growthbook])

    useEffect(() => {
        const fetchFeatures = () => {
            if (!serverUrl) return

            const prev = growthbook.getFeatures()
            let next = prev
            fetch(`${serverUrl}/api/features`)
                .then((res) => res.json())
                .then((newFeatures) => {
                    next = newFeatures
                })
                .catch(e => {
                    if (!growthbook.ready && isEmpty(prev)) {
                        // NOTE: we need to update features so that growthbook is ready to work
                        next = prev
                    }
                    console.error(e)
                })
                .finally(() => {
                    if (!growthbook.ready || !isEqual(prev, next)) {
                        setFeature(next)
                    }
                })
        }

        fetchFeatures()
        const handler = setInterval(() => fetchFeatures(), FEATURES_RE_FETCH_INTERVAL_IN_MS)

        return () => {
            clearInterval(handler)
        }
    }, [growthbook])

    useEffect(() => {
        if (!features || userIsLoading || organizationIsLoading) return

        growthbook.setPayload({ features: features })
    }, [features, userIsLoading, organizationIsLoading])

    useEffect(() => {
        updateContext({ isSupport: isSupport || isAdmin, organization: get(organization, 'id'), userId })
    }, [updateContext, isAdmin, isSupport, organization, userId])

    return (
        <FeatureFlagsContext.Provider value={{
            useFlag,
            useFlagValue,
            updateContext,
        }}>
            {children}
        </FeatureFlagsContext.Provider>
    )
}

const FeatureFlagsProvider: React.FC<{ initFeatures? }> = ({ children, initFeatures = null }) => {
    return (
        <GrowthBookProvider growthbook={growthbook}>
            <FeatureFlagsProviderWrapper initFeatures={initFeatures}>
                {children}
            </FeatureFlagsProviderWrapper>
        </GrowthBookProvider>
    )
}

// @ts-ignore
if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) FeatureFlagsProvider.whyDidYouRender = true

const initOnRestore = async (ctx) => {
    let features = null
    const isOnServerSide = typeof window === 'undefined'

    if (isOnServerSide) {
        try {
            const response = await fetch(`${serverUrl}/api/features`)
            features = await response.json()
        } catch (error) {
            console.error('Error while running `withFeatureFlags`', error)
            features = null
        }
    }

    return { features }
}

type WithFeatureFlagsProps = {
    ssr?: boolean
}
export type WithFeatureFlags = (props: WithFeatureFlagsProps) => (PageComponent: NextPage<any>) => NextPage<any>

const withFeatureFlags: WithFeatureFlags = ({ ssr = false }) => PageComponent => {
    const WithFeatureFlags = ({ features, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithFeatureFlags()', features)

        return (
            <FeatureFlagsProvider initFeatures={features}>
                <PageComponent {...pageProps} />
            </FeatureFlagsProvider>
        )
    }

    if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) WithFeatureFlags.whyDidYouRender = true

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithFeatureFlags.displayName = `withFeatureFlags(${displayName})`
    }

    if (ssr || PageComponent.getInitialProps) {
        WithFeatureFlags.getInitialProps = async (ctx) => {
            if (DEBUG_RERENDERS) console.log('WithIntl.getInitialProps()', ctx)
            const isOnServerSide = typeof window === 'undefined'
            const { features } = await initOnRestore(ctx)
            const pageProps = await getContextIndependentWrappedInitialProps(PageComponent, ctx)

            if (isOnServerSide) {
                preventInfinityLoop(ctx)
            }

            return {
                ...pageProps,
                features,
            }
        }
    }

    return WithFeatureFlags
}

export { useFeatureFlags, FeatureFlagsProvider, FeaturesReady, withFeatureFlags }
