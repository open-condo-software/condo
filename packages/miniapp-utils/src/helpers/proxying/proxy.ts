import httpProxy from 'http-proxy'

import { getProxyHeadersForIp, getRequestIp, replaceUpstreamEndpoint } from './utils'

import type { KnownProxies } from './utils'
import type { IncomingMessage, ServerResponse } from 'http'

type IpProxyingOptions = {
    /** ID of the proxy to pass as x-proxy-id header */
    proxyId: string
    /** secret to sign x-proxy-signature header */
    proxySecret: string
    /** List of known proxies before current one from which IP can be extracted */
    knownProxies?: KnownProxies
}

type RelativeOrAbsoluteEndpoint = string

export type ProxyOptions = {
    /** Name of the proxy. Primarily used to set "via" header */
    name: string
    /** Proxy prefix which will be removed from request url  */
    proxyPrefix: string
    /** Upstream host to proxy requests to */
    upstreamOrigin: string
    /** Upstream prefix to add to request url */
    upstreamPrefix: string
    /** IP proxying options, if specified, IP will be passed used signed x-proxy-id, x-proxy-ip, x-proxy-timestamp, x-proxy-signature headers */
    ipProxying?: IpProxyingOptions
    locationRewrites?: Record<RelativeOrAbsoluteEndpoint, RelativeOrAbsoluteEndpoint>
    cookiePathRewrites?: Record<RelativeOrAbsoluteEndpoint, RelativeOrAbsoluteEndpoint>
}

type ProxyHandler = (req: IncomingMessage, res: ServerResponse) => void

export function createProxy (options: ProxyOptions): ProxyHandler {
    const {
        name,
        proxyPrefix,
        upstreamOrigin,
        upstreamPrefix,
        ipProxying,
        locationRewrites,
        cookiePathRewrites,
    } = options

    const proxy = httpProxy.createProxy({
        target: upstreamOrigin,
        changeOrigin: true,
    })

    proxy.on('proxyReq', (proxyReq, req) => {
        if (req.url?.startsWith(proxyPrefix)) {
            proxyReq.path = upstreamPrefix + req.url.slice(proxyPrefix.length)
        }
        proxyReq.setHeader('via', name)

        if (req.url && req.method && ipProxying) {
            const ip = getRequestIp(req, () => true, ipProxying.knownProxies)
            const headers = getProxyHeadersForIp(req.method, req.url, ip, ipProxying.proxyId, ipProxying.proxySecret)
            for (const [headerName, headerValue] of Object.entries(headers)) {
                proxyReq.setHeader(headerName, headerValue)
            }
        }
    })
    proxy.on('proxyRes', (proxyRes, _req, _res) => {
        if (proxyRes.headers.location) {
            proxyRes.headers.location = replaceUpstreamEndpoint({
                endpoint: proxyRes.headers.location,
                proxyPrefix,
                upstreamPrefix,
                upstreamOrigin,
                rewrites: locationRewrites,
            })
        }

        // Handle Set-Cookie headers to rewrite cookie paths
        const setCookieHeaders = proxyRes.headers['set-cookie']
        if (setCookieHeaders) {
            proxyRes.headers['set-cookie'] = setCookieHeaders.map(cookieString => {
                return cookieString.replace(/;\s*Path=([^;]+)/i, (match, pathValue) => {
                    const rewrittenPath = replaceUpstreamEndpoint({
                        endpoint: pathValue,
                        proxyPrefix,
                        upstreamPrefix,
                        upstreamOrigin,
                        rewrites: cookiePathRewrites,
                    })
                    return match.replace(pathValue, rewrittenPath)
                })
            })
        }
    })

    return proxy.web.bind(proxy)
}