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

// TODO: Remove once button from @condo/domains is removed
type ButtonCLick = {
    id?: string
    value?: string
    type?: string
    component: 'Button'
}

type MenuItemClick =  {
    id: string
    component: 'MenuItem'
}

type Events = {
    'click': ButtonCLick | MenuItemClick
    'ticket_comment_submit': Record<string, never>
}

type UserData = {
    name?: string | null
    type?: string | null
}

type AppGroups =
    'organization.id' |
    'organization.type' |
    'organization.tin' |
    'employee.role'

function initAnalytics (): Analytics<Events, UserData, AppGroups> {
    const plugins: Array<AnalyticsPlugin> = []

    if (posthogApiKey && posthogApiHost && !isSSR()) {
        plugins.push(postHog({
            enabled: true,
            token: posthogApiKey,
            options: {
                // TODO(SavelevMatthew): replace this back to proxy once you've figured out,
                //  why 308 are not followed correctly
                // api_host: '/api/ph',
                api_host: posthogApiHost,
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