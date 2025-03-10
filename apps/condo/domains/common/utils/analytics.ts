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

type ButtonClickEventData = CommonLegacyComponentProps & {
    value?: string
    type?: string
    component: 'Button'
}

type MenuItemClickEventData = CommonLegacyComponentProps & {
    id: string
    component: 'MenuItem'
}

type GQLInputChangeEventData = CommonLegacyComponentProps & {
    value: string | Array<string>
    component: 'GraphQLSearchInput'
}

type DateRangeChangeEventData = CommonLegacyComponentProps & {
    from: string
    to: string
    id: string
    component: 'DateRangePicker'
}

type CheckboxCheckEventData = CommonLegacyComponentProps & {
    component: 'Checkbox'
    value: string
}

type TicketExportToPdfEventData = {
    selectedCommentCount: 'all' | 'nothing' | 'some'
    haveAllComments: boolean
    haveListCompletedWorks: boolean
    haveConsumedMaterials: boolean
    haveTotalCostWork: boolean
    selectedTicketsCount: number | null
    mode: 'single' | 'multiple' | null
}

export type EventsData = {
    'click': ButtonClickEventData | MenuItemClickEventData
    'change': GQLInputChangeEventData | DateRangeChangeEventData
    'check': CheckboxCheckEventData
    'ticket_comment_submit': Record<string, never>
    'import_complete': Record<string, never>
    'file_upload': { fileId: string, location: string }
    'miniapp_session_start': { appId: string, startedAt: string }
    'miniapp_session_end': { appId: string, startedAt: string, durationInSec: number }
    'news_template_change': { title: string, body: string }
    'ticket_export_to_pdf_task_start': TicketExportToPdfEventData
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

function initAnalytics (): Analytics<EventsData, UserData, AppGroups> {
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

    return new Analytics<EventsData, UserData, AppGroups>({
        app: appName,
        version: currentVersion,
        debug: isDebug(),
        plugins,
    })
}

export const analytics = initAnalytics()