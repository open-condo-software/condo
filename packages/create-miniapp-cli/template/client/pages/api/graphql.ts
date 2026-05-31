import httpProxy from 'http-proxy'
import getConfig from 'next/config'

// @if OIDC
import { getSession } from '~/domains/common/utils/session'
// @endif

import type { NextApiRequest, NextApiResponse } from 'next'

const {
    publicRuntimeConfig: { serverUrl },
} = getConfig()

const proxy = httpProxy.createProxy()

export const config = {
    api: {
        bodyParser: false,
    },
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
    // @if OIDC
    const session = await getSession(req, res)
    // @endif

    return new Promise<void>((resolve, reject) => {
        // @if OIDC
        proxy.once('proxyReq', (proxyReq) => {
            if (session?.accessToken) {
                proxyReq.setHeader('Authorization', `Bearer ${session.accessToken}`)
            }
        })
        // @endif

        proxy.web(req, res, {
            target: `${serverUrl}/admin/api`,
            changeOrigin: true,
            ignorePath: true,
        }, (err) => {
            if (err) {
                return reject(err)
            }
            return resolve()
        })
    })
}
