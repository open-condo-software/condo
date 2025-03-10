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

// TODO: Remove the types after components replaces with ones from @open-condo/ui

type CommonLegacyComponentProps = {
    location: string
    id?: string
}

type ButtonCLick = CommonLegacyComponentProps & {
    value?: string
    type?: string
    component: 'Button'
}

type MenuItemClick = CommonLegacyComponentProps & {
    id: string
    component: 'MenuItem'
}

type GQLInputChange = CommonLegacyComponentProps & {
    value: string | Array<string>
    component: 'GraphQLSearchInput'
}

type DateRangeChange = CommonLegacyComponentProps & {
    from: string
    to: string
    id: string
    component: 'DateRangePicker'
}

type CheckboxCheck = CommonLegacyComponentProps & {
    component: 'Checkbox'
    value: string
}


type Events = {
    'click': ButtonCLick | MenuItemClick
    'change': GQLInputChange | DateRangeChange
    'check': CheckboxCheck
    'ticket_comment_submit': Record<string, never>
    'import_complete': Record<string, never>
    'file_upload': { fileId: string, location: string }
    'miniapp_session_start': { appId: string, startedAt: string }
    'miniapp_session_end': { appId: string, startedAt: string, durationInSec: number }
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