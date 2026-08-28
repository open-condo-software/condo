import type { AnalyticsPlugin, PluginIdentifyData, PluginMethods } from '../types'

const withTimeout = (visitorId: Promise<string | undefined> | undefined): Promise<string | undefined> => {
    if (!visitorId) return Promise.resolve(undefined)

    return Promise.race([
        visitorId,
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 2000)),
    ]).catch(() => undefined)
}

async function _shareVisitorIds (data: PluginIdentifyData): Promise<PluginIdentifyData> {
    const { instance, payload } = data
    const plugins = instance.plugins as Record<string, PluginMethods>

    const entries = await Promise.all(
        Object.entries(plugins)
            .map(async ([name, plugin]) => [name, await withTimeout(plugin.getVisitorId?.())] as const)
    )

    payload.visitorIdKeys = []
    for (const [name, id] of entries) {
        if (id) {
            payload.traits[name] = id
            payload.visitorIdKeys.push(name)
        }
    }

    return data
}

export const VisitorIdSharingMiddlewarePlugin: AnalyticsPlugin = {
    name: 'analytics-plugin-visitor-id-sharing',
    identify: _shareVisitorIds,
}
