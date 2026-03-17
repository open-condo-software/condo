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
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'


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

export interface BaseAnalyticsUserData {
    userId?: string | null
    isSupport?: boolean
    isAdmin?: boolean
    organizationId?: string | null
}

type FeatureFlagsProviderWrapperProps<TAnalyticsUserData extends BaseAnalyticsUserData = BaseAnalyticsUserData> = {
    initFeatures?: FeatureDefinitions
    analyticsUserData?: TAnalyticsUserData
}

const FeatureFlagsProviderWrapper = <TAnalyticsUserData extends BaseAnalyticsUserData = BaseAnalyticsUserData>({ children, initFeatures = null, analyticsUserData = {} as TAnalyticsUserData }: React.PropsWithChildren<FeatureFlagsProviderWrapperProps<TAnalyticsUserData>>) => {
    const growthbook = useGrowthBook()
    const { user, isLoading: userIsLoading  } = useAuth()
    const { employee, isLoading: organizationIsLoading } = useOrganization()
    const [features, setFeature] = useState(initFeatures)

    // Use analyticsUserData if provided, otherwise fallback to useAuth/useOrganization
    const isSupport = analyticsUserData?.isSupport ?? user?.isSupport
    const isAdmin = analyticsUserData?.isAdmin ?? user?.isAdmin
    const userId = analyticsUserData?.userId ?? user?.id

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
        const organizationId = analyticsUserData?.organizationId ?? employee?.organization?.id
        updateContext({ isSupport: isSupport || isAdmin, organization: organizationId, userId })
    }, [updateContext, isAdmin, isSupport, analyticsUserData?.organizationId, employee?.organization?.id, userId])

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

type FeatureFlagsProviderProps<TAnalyticsUserData extends BaseAnalyticsUserData = BaseAnalyticsUserData> = FeatureFlagsProviderWrapperProps<TAnalyticsUserData>

const FeatureFlagsProvider = <TAnalyticsUserData extends BaseAnalyticsUserData = BaseAnalyticsUserData>({ children, initFeatures = null, analyticsUserData = {} as TAnalyticsUserData }: React.PropsWithChildren<FeatureFlagsProviderProps<TAnalyticsUserData>>) => {
    const { user, isLoading: userIsLoading  } = useAuth()
    const { employee, isLoading: organizationIsLoading } = useOrganization()

    const [growthbookInstance] = useState(() => {
        // NOTE: We need to fill the growthbook during server rendering so that the correct page is generated
        // Use analyticsUserData if provided, otherwise fallback to useAuth/useOrganization
        const isSupport = analyticsUserData?.isSupport ?? user?.isSupport
        const isAdmin = analyticsUserData?.isAdmin ?? user?.isAdmin
        const userId = analyticsUserData?.userId ?? user?.id
        const organizationId = analyticsUserData?.organizationId ?? employee?.organization?.id

        const context: Context = {}

        // NOTE: After we write feature to the growthbook, the growthbook will be marked as ready.
        // Therefore, if not all the necessary data is loaded,
        // then we want to consider that the growthbook is not ready for work
        if (!userIsLoading && !organizationIsLoading && initFeatures) {
            context.features = initFeatures
        }

        context.attributes = {
            isSupport: isSupport || isAdmin,
            organization: organizationId,
            userId,
        }

        return new GrowthBook(context)
    })

    return (
        <GrowthBookProvider growthbook={growthbookInstance}>
            <FeatureFlagsProviderWrapper<TAnalyticsUserData> initFeatures={initFeatures} analyticsUserData={analyticsUserData}>
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
export type WithFeatureFlags = (props: WithFeatureFlagsProps) => (PageComponent: NextPage) => NextPage

const withFeatureFlags: WithFeatureFlags = ({ ssr = false }) => PageComponent => {
    const WithFeatureFlags = ({ features, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithFeatureFlags()', features)

        const analyticsUserData = pageProps?.pageProps?.analyticsUserData || {}

        return (
            <FeatureFlagsProvider initFeatures={features} analyticsUserData={analyticsUserData}>
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
