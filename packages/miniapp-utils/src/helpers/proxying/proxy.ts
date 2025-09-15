import httpProxy from 'http-proxy'

import { getProxyHeadersForIp, getRequestIp, replaceUpstreamEndpoint } from './utils'

import type { KnownProxies, TrustProxyFunction } from './utils'
import type { IncomingMessage, ServerResponse } from 'http'

type IpProxyingOptions = {
    /** ID of the proxy to pass as x-proxy-id header */
    proxyId: string
    /** secret to sign x-proxy-signature header */
    proxySecret: string
    /** List of known proxies before current one from which IP can be extracted */
    knownProxies?: KnownProxies
    /**
     * Function to determine if a given IP address should be as x-forwarded-for header source.
     * Defaults to () => false, which means all IP addresses are trusted
     * */
    trustProxyFn?: TrustProxyFunction
}

type LoggerType = {
    error: (data: unknown) => void
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
    /** 
     * Map of location header rewrites for redirects. 
     * Key: upstream location, Value: rewritten location for client.
     * Used to rewrite Location headers in 3xx redirect responses.
     */
    locationRewrites?: Record<RelativeOrAbsoluteEndpoint, RelativeOrAbsoluteEndpoint>
    /** 
     * Map of cookie path rewrites for Set-Cookie headers.
     * Key: upstream cookie path, Value: rewritten path for client.
     * Used to adjust cookie scope when proxying between different path prefixes.
     */
    cookiePathRewrites?: Record<RelativeOrAbsoluteEndpoint, RelativeOrAbsoluteEndpoint>
    /** 
     * Logger instance for error reporting. Defaults to console if not provided.
     * Must implement an error method that accepts any data type.
     */
    logger?: LoggerType
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
        logger = console,
    } = options

    const proxy = httpProxy.createProxy({
        target: upstreamOrigin,
        changeOrigin: true,
    })

    const trustProxyFn = ipProxying?.trustProxyFn ?? (() => false)

    proxy.on('proxyReq', (proxyReq, req) => {
        if (req.url?.startsWith(proxyPrefix)) {
            proxyReq.path = upstreamPrefix + req.url.slice(proxyPrefix.length)
        }
        proxyReq.setHeader('via', name)

        if (req.url && req.method && ipProxying) {
            const ip = getRequestIp(req, trustProxyFn, ipProxying.knownProxies)
            const headers = getProxyHeadersForIp(req.method, proxyReq.path, ip, ipProxying.proxyId, ipProxying.proxySecret)
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

    return function syncProxyHandler (req, res) {
        proxy.web(req, res, {}, (err) => {
            if (err) {
                // TODO: Add more complex loggers and standard error handling in next iterations
                logger.error({ msg: 'Proxy error', err })
                if (!res.headersSent) {
                    res.writeHead(502, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ errors: [{ message: 'Proxy error' }] }))
                } else {
                    res.end()
                }
            }
        })
    }
}