import httpProxy from 'http-proxy'
import getConfig from 'next/config'

import { getPosthogEndpoint } from '@open-condo/miniapp-utils'

import type { NextApiRequest, NextApiResponse } from 'next'

const {
    publicRuntimeConfig: { posthogApiHost },
    serverRuntimeConfig: { proxyName },
} = getConfig()

export const config = {
    api: {
        bodyParser: false,
    },
}

function _getRequestedPath (path: NextApiRequest['query'][string]): Array<string> {
    if (Array.isArray(path)) return path
    if (path) return [path]

    return []
}

const REDIRECT_CODES = new Set([301, 302, 307, 308])

const proxy = httpProxy.createProxy()
proxy.on('proxyReq',  (proxyReq) => {
    proxyReq.setHeader('via', proxyName)
})

proxy.on('proxyRes', (proxyRes) => {
    if (proxyRes.statusCode && REDIRECT_CODES.has(proxyRes.statusCode)) {
        if (proxyRes.headers.location) {
            // NOTE: Relative urls handler
            if (proxyRes.headers.location.startsWith('/')) {
                proxyRes.headers.location = `/api/ph${proxyRes.headers.location}`
            }
        }
    }
})

export default function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (!posthogApiHost) {
            res.status(404).json({ error: 'Proxying service are not found' })
            return resolve()
        }

        const requestedPath = _getRequestedPath(req.query.path)

        const requestedUrl = new URL(`https://_${req.url || ''}`)
        const targetUrl = new URL(getPosthogEndpoint(posthogApiHost, requestedPath))
        targetUrl.search = requestedUrl.search

        proxy.web(req, res, { target: targetUrl.toString(), changeOrigin: true }, (err) => {
            if (err) {
                return reject(err)
            }
            return resolve()
        })
    })
}
