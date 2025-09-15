import getConfig from 'next/config'

import { createProxy } from '@open-condo/miniapp-utils/helpers/proxying'

const {
    publicRuntimeConfig: { serverUrl },
    serverRuntimeConfig: { proxyName },
} = getConfig()

export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
}

const proxyHandler = createProxy({
    name: proxyName,
    proxyPrefix: '/api/graphql',
    upstreamOrigin: serverUrl,
    upstreamPrefix: '/admin/api',
})

export default proxyHandler
