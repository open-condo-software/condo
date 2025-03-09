import postHog from '@metro-fs/analytics-plugin-posthog'
import getConfig from 'next/config'

import { Analytics, isSSR, isDebug } from '@open-condo/miniapp-utils'
import type { AnalyticsPlugin } from '@open-condo/miniapp-utils'

const {
    publicRuntimeConfig: {
        appName,
        currentVersion,
        posthogApiHost,
        posthogApiKey,
    },
} = getConfig()

type Events = {
    // 'organization_create': { user: string, addressKey: string }
}

type UserData = {
    name?: string | null
    type?: string | null
}

type AppGroups = 'addressKey'

function initAnalytics (): Analytics<Events, UserData, AppGroups> {
    const plugins: Array<AnalyticsPlugin> = []

    if (posthogApiKey && posthogApiHost && !isSSR()) {
        plugins.push(postHog({
            enabled: true,
            token: posthogApiKey,
            options: {
                api_host: '/api/ph',
                debug: isDebug(),
                autocapture: false,
            },
        }))
    }

    return new Analytics<Events, UserData, AppGroups>({
        app: appName,
        version: currentVersion,
        debug: isDebug(),
        plugins,
    })
}

export const analytics = initAnalytics()