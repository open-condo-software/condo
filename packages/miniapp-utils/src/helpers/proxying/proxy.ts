import httpProxy from 'http-proxy'

import type { IncomingMessage, ServerResponse } from 'http'

export type ProxyOptions = {
    proxyPrefix: string
    upstreamHost: string
    upstreamPrefix: string
}

type ProxyHandler = (req: IncomingMessage, res: ServerResponse) => void

export function createProxy (options: ProxyOptions): ProxyHandler {
    const { proxyPrefix, upstreamHost, upstreamPrefix } = options
    const proxy = httpProxy.createProxy({
        target: upstreamHost,
        changeOrigin: true,
    })

    proxy.on('proxyReq', (proxyReq, req) => {
        if (req.url?.startsWith(proxyPrefix)) {
            proxyReq.path = upstreamPrefix + req.url.slice(proxyPrefix.length)
        }
    })

    return proxy.web.bind(proxy)
}