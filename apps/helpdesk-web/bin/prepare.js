const { updateAppEnvFile, registerAppProxy } = require('@open-condo/cli')


const main = async () => {
    // register oidc url in condo
    const appName = 'helpdesk-web'

    //await syncWithLocalDevPortalApi()
    // SSR Proxy for self
    const { proxyId, proxySecret } =  await registerAppProxy(appName, `${appName}-ssr`)
    await updateAppEnvFile(appName, 'SSR_PROXY_CONFIG', JSON.stringify({ proxyId, proxySecret }))

    // Generic proxy for API
    const { proxyId: apiProxyId, proxySecret: apiProxySecret } = await registerAppProxy('condo', 'condo-api')
    await updateAppEnvFile(appName, 'API_PROXY_CONFIG', JSON.stringify({ proxyId: apiProxyId, proxySecret: apiProxySecret }))

    console.log('Done')
}

main(process.argv.slice(2))
    .then(() => {
        process.exit()
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
