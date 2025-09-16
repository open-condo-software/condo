const path = require('path')

const { getAppServerUrl, updateAppEnvFile, registerAppProxy } = require('@open-condo/cli')

const APP_NAME = path.basename(path.resolve(__dirname, '..')) 

async function syncWithLocalDevPortalApi () {
    const apiServerUrl = await getAppServerUrl('dev-portal-api')
    await updateAppEnvFile(APP_NAME, 'SERVER_URL', apiServerUrl)
    // const { secret } = await registerAppProxy('dev-portal-api', 'dev-portal-web')
}

async function main () {
    await syncWithLocalDevPortalApi()
    const { proxyName, secret } =  await registerAppProxy('dev-portal-web', 'ssr')
    await updateAppEnvFile(APP_NAME, 'SSR_PROXY_CONFIG', JSON.stringify({ proxyId: proxyName, proxySecret: secret }))
}

main().then(() => {
    console.log('done')
    process.exit()
}).catch((err) => {
    console.error(err)
    process.exit(1)
})

