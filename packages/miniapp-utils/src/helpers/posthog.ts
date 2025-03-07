type Rewrite = {
    source: string
    destination: string
}

const POSTHOG_CLOUD_HOST_BASE = 'i.posthog.com'
const POSTHOG_CLOUD_HOST_MATCHER = new RegExp(`^(\\w+)\\.${POSTHOG_CLOUD_HOST_BASE.replaceAll('.', '\\.')}$`)

/**
 * Gets posthog endpoint based on its domain and requested path.
 * Used to support both cloud and self-hosted instances, which differs in set of endpoints.
 * See example below for detailed explanation:
 * @example
 * getPosthogPath('https://eu.i.posthog.com', ['static', 'something']) // https://eu-assets.i.posthog.com/something
 * getPosthogPath('https://eu.i.posthog.com', ['other', 'path']) // https://eu.i.posthog.com/other/path
 * getPosthogPath('https://ph.self-hosted.com', ['static', 'something']) // https://ph.self-hosted.com/static/something
 * getPosthogPath('https://ph.self-hosted.com', ['other', 'path']) // https://ph.self-hosted.com/other/path
 */
export function getPosthogEndpoint (posthogDomain: string, requestedPath: Array<string>): string {
    const posthogURL = new URL(posthogDomain)

    const cloudMatch = posthogURL.host.match(POSTHOG_CLOUD_HOST_MATCHER)
    if (cloudMatch && cloudMatch.length > 1) {
        const region = cloudMatch[1]
        if (requestedPath.length && requestedPath[0] === 'static') {
            posthogURL.host = `${region}-assets.${POSTHOG_CLOUD_HOST_BASE}`
            posthogURL.pathname = requestedPath.slice(1).join('/')
            return posthogURL.toString()
        }
    }

    posthogURL.pathname = requestedPath.join('/')
    return posthogURL.toString()
}

/**
 * Generates Next.js rewrites based on PostHog domain,
 * so that PostHog can run in cloud and self-hosted versions without any ad blocker restrictions
 * @example
 * generateRewrites('https://eu.i.posthog.com', '/api/posthog')
 * generateRewrites('https://posthog.my.domain.com', '/api/posthog')
 * generateRewrites(process.env.NEXT_PUBLIC_POSTHOG_HOST, '/api/posthog')
 *
 * @deprecated This util is not used in condo applications and will be removed in next major upgrade,
 * since it requires knowing postHogDomain during build time. Consider setting up http proxy on API route instead
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
        ]
    }

    return [
        {
            source: `${routeEndpoint}/:path*`,
            destination: `${postHogDomain}/:path*`,
        },
    ]
}