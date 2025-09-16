import getConfig from 'next/config'

import { createProxy } from '@open-condo/miniapp-utils/helpers/proxying'

const {
    publicRuntimeConfig: { serverUrl },
    serverRuntimeConfig: { proxyName, trustedProxiesConfig, apiProxyConfig },
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
    ipProxying: apiProxyConfig ? {
        proxyId: apiProxyConfig.proxyId,
        proxySecret: apiProxyConfig.proxySecret,
        trustProxyFn: () => true,
        knownProxies: trustedProxiesConfig,
    } : undefined,
})

export default proxyHandler
