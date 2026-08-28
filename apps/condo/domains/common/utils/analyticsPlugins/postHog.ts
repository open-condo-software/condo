import postHog from '@metro-fs/analytics-plugin-posthog'

import type { AnalyticsPlugin } from '@open-condo/miniapp-utils'

// Exposes PostHog's own distinct_id as a visitor id, so other providers can link to it
export function postHogAnalyticsPlugin (config: Parameters<typeof postHog>[0]): AnalyticsPlugin {
    const plugin = postHog(config)

    return {
        ...plugin,
        methods: {
            ...plugin.methods,
            getVisitorId: async () => plugin.methods.getDistinctId(),
        },
    }
}
