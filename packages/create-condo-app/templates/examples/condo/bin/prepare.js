const path = require('path')

const { registerMiniapp, updateAppEnvFile } = require('@open-condo/cli')

async function prepare () {
    const appName = path.basename(path.dirname(__dirname))
    const { clientSecret } = await registerMiniapp({ name: appName })
    await updateAppEnvFile(appName, 'OIDC_CLIENT_ID', appName)
    await updateAppEnvFile(appName, 'OIDC_CLIENT_SECRET', clientSecret)
}

prepare().then(() => {
    process.exit(0)
}).catch(e => {
    console.error(e)
    process.exit(1)
})