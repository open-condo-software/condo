const path = require('path')

const { getAppServerUrl, updateAppEnvFile, registerAppProxy } = require('@open-condo/cli')

const APP_NAME = path.basename(path.resolve(__dirname, '..')) 

async function syncWithLocalDevPortalApi () {
    const apiServerUrl = await getAppServerUrl('dev-portal-api')
    await updateAppEnvFile(APP_NAME, 'SERVER_URL', apiServerUrl)
}

async function main () {
    await syncWithLocalDevPortalApi()
    // SSR Proxy for self
    const { proxyId, proxySecret } =  await registerAppProxy('dev-portal-web', 'dev-portal-web-ssr')
    await updateAppEnvFile(APP_NAME, 'SSR_PROXY_CONFIG', JSON.stringify({ proxyId, proxySecret }))

    // Generic proxy for API
    const { proxyId: apiProxyId, proxySecret: apiProxySecret } = await registerAppProxy('dev-portal-api', 'dev-portal-web-api')
    await updateAppEnvFile(APP_NAME, 'API_PROXY_CONFIG', JSON.stringify({ proxyId: apiProxyId, proxySecret: apiProxySecret }))
}

main().then(() => {
    console.log('done')
    process.exit()
}).catch((err) => {
    console.error(err)
    process.exit(1)
})

