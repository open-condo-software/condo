import getConfig from 'next/config'

import { createProxy } from '@open-condo/miniapp-utils/helpers/proxying'

const {
    publicRuntimeConfig: { serverUrl },
    serverRuntimeConfig: { proxyName, apiProxyConfig },
} = getConfig()

export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
}

const proxyHandler = createProxy({
    name: proxyName,
    proxyPrefix: '/api/oidc',
    upstreamOrigin: serverUrl,
    upstreamPrefix: '/api/oidc',
    ipProxying: apiProxyConfig ? {
        proxyId: apiProxyConfig.proxyId,
        proxySecret: apiProxyConfig.proxySecret,
        trustProxyFn: () => true,
    } : undefined,
})

export default proxyHandler
