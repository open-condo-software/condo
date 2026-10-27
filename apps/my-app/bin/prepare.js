const fs = require('fs')
const path = require('path')

const { registerMiniapp, updateAppEnvFile } = require('@open-condo/cli')

async function prepare () {
    const appPath = path.dirname(__dirname)
    const appName = path.basename(appPath)
    const hasApiRoutes = fs.existsSync(path.join(appPath, 'pages/api'))
    const { clientSecret } = await registerMiniapp({
        name: appName,
        oidcFlow: hasApiRoutes ? 'code' : 'pkce',
    })
    await updateAppEnvFile(appName, 'OIDC_CLIENT_ID', appName)
    await updateAppEnvFile(appName, 'OIDC_CLIENT_SECRET', clientSecret)
}

prepare().then(() => {
    process.exit(0)
}).catch(e => {
    console.error(e)
    process.exit(1)
})