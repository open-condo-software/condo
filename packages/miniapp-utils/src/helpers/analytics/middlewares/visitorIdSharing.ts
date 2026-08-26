import type { AnalyticsPlugin, PluginIdentifyData, PluginMethods } from '../types'

async function _shareVisitorIds (data: PluginIdentifyData): Promise<PluginIdentifyData> {
    const { instance, payload } = data
    const plugins = instance.plugins as Record<string, PluginMethods>

    const entries = await Promise.all(
        Object.entries(plugins)
            .map(async ([name, plugin]) => [name, await plugin.getVisitorId?.()] as const)
    )

    for (const [name, id] of entries) {
        if (id) payload.traits[name] = id
    }

    return data
}

export const VisitorIdSharingMiddlewarePlugin: AnalyticsPlugin = {
    name: 'analytics-plugin-visitor-id-sharing',
    identify: _shareVisitorIds,
}
