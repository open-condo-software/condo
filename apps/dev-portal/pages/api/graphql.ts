import httpProxy from 'http-proxy'
import getConfig from 'next/config'

import type { NextApiRequest, NextApiResponse } from 'next'

const proxy = httpProxy.createProxy()

const { publicRuntimeConfig: { serverUrl } } = getConfig()

export const config = {
    api: {
        bodyParser: false,
    },
}

export default function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        proxy.web(req, res, { target: `${serverUrl}/admin/api`, changeOrigin: true }, (err) => {
            if (err) {
                return reject(err)
            }
            return resolve()
        })
    })
}
