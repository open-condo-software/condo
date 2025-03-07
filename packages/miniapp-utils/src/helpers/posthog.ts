type Rewrite = {
    source: string
    destination: string
}

const POSTHOG_CLOUD_HOST_BASE = 'i.posthog.com'
const POSTHOG_CLOUD_HOST_MATCHER = new RegExp(`^(\\w+)\\.${POSTHOG_CLOUD_HOST_BASE.replaceAll('.', '\\.')}$`)

/**
 * Gets posthog host and pathname based on domain and requested path. See example below for detailed explanation
 * @example
 * getPosthogPath('https://eu.i.posthog.com', ['static', 'something']) // { host: 'eu-assets.i.posthog.com', pathname: 'something' }
 * getPosthogPath('https://eu.i.posthog.com', ['other', 'path']) // { host: 'eu.i.posthog.com', pathname: 'other/path' }
 * getPosthogPath('https://ph.self-hosted.com', ['static', 'something']) // { host: 'ph.self-hosted.com', pathname: 'static/something' }
 * getPosthogPath('https://ph.self-hosted.com', ['other', 'path']) // { host: 'ph.self-hosted.com', pathname: 'other/path' }
 */
export function getPosthogEndpoint (posthogDomain: string, requestedPath: Array<string>): { host: string, pathname: string } {
    const posthogURL = new URL(posthogDomain)
    const cloudMatch = posthogURL.host.match(POSTHOG_CLOUD_HOST_MATCHER)
    if (cloudMatch && cloudMatch.length > 1) {
        const region = cloudMatch[1]
        if (requestedPath.length && requestedPath[0] === 'static') {
            return { host: `${region}-assets.${POSTHOG_CLOUD_HOST_BASE}`, pathname: requestedPath.slice(1).join('/') }
        }
    }

    return { host: posthogURL.host, pathname: requestedPath.join('/') }
}

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
        ]
    }

    return [
        {
            source: `${routeEndpoint}/:path*`,
            destination: `${postHogDomain}/:path*`,
        },
    ]
}