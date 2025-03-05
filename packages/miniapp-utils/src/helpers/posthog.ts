type Rewrite = {
    source: string
    destination: string
}

const POSTHOG_CLOUD_HOST_BASE = 'i.posthog.com'
const POSTHOG_CLOUD_HOST_MATCHER = new RegExp(`^(\\w+)\\.${POSTHOG_CLOUD_HOST_BASE.replaceAll('.', '\.')}$`)

/**
 * Generates Next.js rewrites based on PostHog domain,
 * so that PostHog can run in cloud and self-hosted versions without any ad blocker restrictions
 * @example
 * generateRewrites('https://eu.i.posthog.com', '/api/posthog')
 * generateRewrites('https://posthog.my.domain.com', '/api/posthog')
 * generateRewrites(process.env.NEXT_PUBLIC_POSTHOG_HOST, '/api/posthog')
 */
export function generateRewrites (postHogDomain: string, routeEndpoint: string): Array<Rewrite> {
    const url = new URL(postHogDomain)

    const match = url.host.match(POSTHOG_CLOUD_HOST_MATCHER)

    // Cloud PH must have separate url for assets
    // SRC: https://posthog.com/docs/advanced/proxy/nextjs
    if (match && match.length > 1) {
        const region = match[1]
        return [
            {
                source: `${routeEndpoint}/static/:path*`,
                destination: `https://${region}-assets.${POSTHOG_CLOUD_HOST_BASE}/static/:path*`,
            },
            {
                source: `${routeEndpoint}/:path*`,
                destination: `https://${region}.${POSTHOG_CLOUD_HOST_BASE}/:path*`,
            },
            {
                source: `${routeEndpoint}/decide`,
                destination: `https://${region}.${POSTHOG_CLOUD_HOST_BASE}/decide`,
            },
        ]
    }

    return [
        {
            source: `${routeEndpoint}/:path*`,
            destination: `${postHogDomain}/:path*`,
        },
    ]
}