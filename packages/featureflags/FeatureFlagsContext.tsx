import {
    FeatureDefinitions,
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
}

const FeatureFlagsContext = createContext<IFeatureFlagsContext>({
    useFlag: () => false,
    useFlagValue: () => null,
    updateContext: () => ({}),
})

const useFeatureFlags = (): IFeatureFlagsContext => useContext(FeatureFlagsContext)

type BasicUserData = { id: string }

export type FeaturesContext<TUserShape extends object, TAppContext extends object> =
    TAppContext & {
        user: TUserShape & BasicUserData | null
        isLoading?: boolean
    }

type FeatureFlagsProviderWrapperProps<TUserShape extends object, TAppContext extends object> = {
    initFeatures?: FeatureDefinitions
    userAttributes?: FeaturesContext<TUserShape, TAppContext>
}

const FeatureFlagsProviderWrapper = <TUserShape extends object, TAppContext extends object>({ children, initFeatures = null, userAttributes = {} as FeaturesContext<TUserShape, TAppContext> }: React.PropsWithChildren<FeatureFlagsProviderWrapperProps<TUserShape, TAppContext>>) => {
    const growthbook = useGrowthBook()
    const [features, setFeature] = useState(initFeatures)

    const { user, isLoading = false, ...appContext } = userAttributes

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
        if (!features || isLoading) return

        growthbook.setPayload({ features: features })
    }, [features, isLoading])

    useEffect(() => {
        if (user) {
            const { id: userId, ...userAttributes } = user
            updateContext({ userId, ...userAttributes, ...(appContext ? appContext : {}) })
        }
    }, [updateContext, user, appContext])

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

type FeatureFlagsProviderProps<TUserShape extends object, TAppContext extends object> = FeatureFlagsProviderWrapperProps<TUserShape, TAppContext>

const FeatureFlagsProvider = <TUserShape extends object, TAppContext extends object>({ children, initFeatures = null, userAttributes = {} as FeaturesContext<TUserShape, TAppContext> }: React.PropsWithChildren<FeatureFlagsProviderProps<TUserShape, TAppContext>>) => {
    const { user, isLoading = false, ...appContext } = userAttributes

    const [growthbookInstance] = useState(() => {
        // NOTE: We need to fill the growthbook during server rendering so that the correct page is generated
        const context: Context = {}

        // NOTE: After we write feature to the growthbook, the growthbook will be marked as ready.
        // Therefore, if not all the necessary data is loaded,
        // then we want to consider that the growthbook is not ready for work
        if (!isLoading && initFeatures) {
            context.features = initFeatures
        }

        if (user) {
            const { id: userId, ...userAttributes } = user

            context.attributes = {
                userId,
                ...userAttributes,
                ...(appContext ? appContext : {}),
            }
        }

        return new GrowthBook(context)
    })

    return (
        <GrowthBookProvider growthbook={growthbookInstance}>
            <FeatureFlagsProviderWrapper<TUserShape, TAppContext> initFeatures={initFeatures} userAttributes={userAttributes}>
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

type WithFeatureFlagsProps<TUserShape extends object, TAppContext extends object> = {
    ssr?: boolean
    useUserAttributes: () => FeaturesContext<TUserShape, TAppContext>
}
export type WithFeatureFlags = <TUserShape extends object, TAppContext extends object>(props: WithFeatureFlagsProps<TUserShape, TAppContext>) => (PageComponent: NextPage) => NextPage

const withFeatureFlags: WithFeatureFlags = ({ ssr = false, useUserAttributes }) => PageComponent => {
    const WithFeatureFlags = ({ features, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithFeatureFlags()', features)

        const userAttributes = useUserAttributes()

        return (
            <FeatureFlagsProvider initFeatures={features} userAttributes={userAttributes}>
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
