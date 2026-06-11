const path = require('path')

const { updateAppEnvFile, getAppEnvValue } = require('@open-condo/cli')
// @if OIDC
const { prepareCondoAppOidcConfig } = require('@open-condo/cli')
// @endif

const APP_NAME = path.basename(path.resolve(__dirname, '..'))
const APP_DOMAIN_ENV = `${APP_NAME.toUpperCase().replaceAll('-', '_')}_DOMAIN`

async function main () {
    const appDomain = await getAppEnvValue(APP_NAME, APP_DOMAIN_ENV)
    // @if OIDC
    const condoDomain = await getAppEnvValue('condo', 'SERVER_URL')
    const redirectUrl = `${appDomain}/api/oidc/callback`
    const postLogoutRedirectUrl = `${appDomain}/auth/signin`

    const oidcConf = await prepareCondoAppOidcConfig(APP_NAME, {
        redirectUrl,
        postLogoutRedirectUrl,
    })

    await updateAppEnvFile(APP_NAME, 'OIDC_CONDO_CLIENT_CONFIG', JSON.stringify(oidcConf))
    await updateAppEnvFile(APP_NAME, 'CONDO_DOMAIN', JSON.stringify(condoDomain))
    // @endif
    await updateAppEnvFile(APP_NAME, 'SERVICE_URL', JSON.stringify(appDomain))
    await updateAppEnvFile(APP_NAME, 'DEFAULT_LOCALE', 'en')

    console.log('done')
}

main().then(() => process.exit(), (error) => {
    console.error(error)
    process.exit(1)
})
