import httpProxy from 'http-proxy'

import { getProxyHeadersForIp, getRequestIp } from './utils'

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

export type ProxyOptions = {
    /** Name of the proxy. Primarily used to set "via" header */
    name: string
    /** Proxy prefix which will be removed from request url  */
    proxyPrefix: string
    /** Upstream host to proxy requests to */
    upstreamHost: string
    /** Upstream prefix to add to request url */
    upstreamPrefix: string
    /** IP proxying options, if specified, IP will be passed used signed x-proxy-id, x-proxy-ip, x-proxy-timestamp, x-proxy-signature headers */
    ipProxying?: IpProxyingOptions
}

type ProxyHandler = (req: IncomingMessage, res: ServerResponse) => void

export function createProxy (options: ProxyOptions): ProxyHandler {
    const {
        name,
        proxyPrefix,
        upstreamHost,
        upstreamPrefix,
        ipProxying,
    } = options
    const proxy = httpProxy.createProxy({
        target: upstreamHost,
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

    return proxy.web.bind(proxy)
}