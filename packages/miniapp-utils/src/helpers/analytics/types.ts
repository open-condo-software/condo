import type { AnalyticsInstance, AnalyticsPlugin } from 'analytics'

export type AnalyticsConfig = {
    app?: string
    version?: string | number
    debug?: boolean
    plugins?: AnalyticsPlugin[]
}

export type AnalyticsInstanceWithGroups<GroupNames extends string> = AnalyticsInstance & {
    groups: Set<GroupNames>
}

export type AnyPayload = Record<string, any>

export type PluginTrackData = AnyPayload & {
    abort(): void
    instance: AnalyticsInstanceWithGroups<string>
    payload: AnyPayload & {
        properties: AnyPayload
    }
}

export type { AnalyticsPlugin, PageData } from 'analytics'