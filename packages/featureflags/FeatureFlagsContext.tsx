import {
    FeatureDefinitions,
    Attributes,
    FeaturesReady,
    GrowthBook,
    GrowthBookProvider,
    useGrowthBook,
    Context,
} from '@growthbook/growthbook-react'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import { NextPage } from 'next'
import getConfig from 'next/config'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { isSSR } from '@open-condo/miniapp-utils'
import {
    DEBUG_RERENDERS,
    DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER,
    getContextIndependentWrappedInitialProps,
    preventInfinityLoop,
} from '@open-condo/next/_utils'


const {
    publicRuntimeConfig: {
        serverUrl,
    },
} = getConfig()

const FEATURES_RE_FETCH_INTERVAL_IN_MS = 60 * 1000 // 1 min

type UseFlagValueType = <T>(name: string) => T | null

interface IFeatureFlagsContext {
    useFlag: (name: string) => boolean
    useFlagValue: UseFlagValueType
    updateContext: (context) => void
    isReady: boolean
}

const FeatureFlagsContext = createContext<IFeatureFlagsContext>({
    useFlag: () => false,
    useFlagValue: () => null,
    updateContext: () => ({}),
    isReady: false,
})

const useFeatureFlags = (): IFeatureFlagsContext => useContext(FeatureFlagsContext)

const FeatureFlagsProviderWrapper: React.FC = ({ children }) => {
    const growthbook = useGrowthBook()

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
                        if (next) {
                            growthbook.setPayload({ features: next })
                        }
                    }
                })
        }

        fetchFeatures()
        const handler = setInterval(() => fetchFeatures(), FEATURES_RE_FETCH_INTERVAL_IN_MS)

        return () => {
            clearInterval(handler)
        }
    }, [growthbook])

    return (
        <FeatureFlagsContext.Provider value={{
            useFlag,
            useFlagValue,
            updateContext,
            isReady: growthbook.ready,
        }}>
            {children}
        </FeatureFlagsContext.Provider>
    )
}

type FeatureFlagsProviderProps = {
    initFeatures?: FeatureDefinitions
    initContext?: Attributes
}

const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children, initFeatures = null, initContext = null }) => {
    const [growthbookInstance] = useState(() => {
        // NOTE: We need to fill the growthbook during server rendering so that the correct page is generated
        const context: Context = {}

        // NOTE: After we write feature to the growthbook, the growthbook will be marked as ready.
        // Therefore, if not all the necessary data is loaded,
        // then we want to consider that the growthbook is not ready for work
        if (initFeatures) {
            context.features = initFeatures
        }

        if (initContext) {
            context.attributes = initContext
        }

        return new GrowthBook(context)
    })

    return (
        <GrowthBookProvider growthbook={growthbookInstance}>
            <FeatureFlagsProviderWrapper>
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
    useInitContext?: () => Attributes
}
export type WithFeatureFlags = (props: WithFeatureFlagsProps) => (PageComponent: NextPage) => NextPage

const withFeatureFlags: WithFeatureFlags = ({ ssr = false, useInitContext = () => ({}) }) => PageComponent => {
    const WithFeatureFlags = ({ features, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithFeatureFlags()', features)

        const initContext = useInitContext()

        return (
            <FeatureFlagsProvider initFeatures={features} initContext={initContext}>
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

    if (ssr || !isSSR() || PageComponent.getInitialProps) {
        WithFeatureFlags.getInitialProps = async (ctx) => {
            if (DEBUG_RERENDERS) console.log('WithIntl.getInitialProps()', ctx)
            const { features } = await initOnRestore(ctx)
            const pageProps = await getContextIndependentWrappedInitialProps(PageComponent, ctx)

            if (isSSR()) {
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
