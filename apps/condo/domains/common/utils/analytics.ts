import postHog from '@metro-fs/analytics-plugin-posthog'
import getConfig from 'next/config'

import { Analytics, isSSR, isDebug } from '@open-condo/miniapp-utils'
import type { AnalyticsPlugin } from '@open-condo/miniapp-utils'

const nextConfig = getConfig()

const appName = nextConfig?.publicRuntimeConfig?.appName
const currentVersion = nextConfig?.publicRuntimeConfig?.currentVersion
const posthogApiHost = nextConfig?.publicRuntimeConfig?.posthogApiHost
const posthogApiKey = nextConfig?.publicRuntimeConfig?.posthogApiKey

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

type TabsChangeEventData = CommonLegacyComponentProps & {
    activeKey: string
    component: 'Tabs'
}

type SelectChangeEventData = CommonLegacyComponentProps & {
    component: 'Select'
    value: string | Array<string>
}

type CheckboxCheckEventData = CommonLegacyComponentProps & {
    component: 'Checkbox'
    value: string
}

type RadioCheckEventData = CommonLegacyComponentProps & {
    component: 'Radio'
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
    'change': GQLInputChangeEventData | DateRangeChangeEventData | TabsChangeEventData | SelectChangeEventData
    'check': CheckboxCheckEventData | RadioCheckEventData
    'ticket_comment_submit': Record<string, never>
    'import_complete': Record<string, never>
    'file_upload': { fileId: string, location: string }
    'miniapp_session_start': { appId: string, startedAt: string }
    'miniapp_session_end': { appId: string, startedAt: string, durationInSec: number }
    'news_template_change': { title: string, body: string }
    'ticket_export_to_pdf_task_start': TicketExportToPdfEventData
    'ticket_share_click': { destination: string }
    'ticket_status_filter_click': { status: string }
    'notification_view': { id?: string, type: string }
    'notifications_list_view': Record<string, never>
    'tour_step_complete': { activeStep: string, type: string }
    'filter_changed': { location: string }
    'incident_status_update': { newStatus: string }
    'ticket_set_favourite_click': Record<string, never>
    'confirm_phone_registration': Record<string, never>
    'confirm_email_registration': Record<string, never>
    'register_user': { userId: string }
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