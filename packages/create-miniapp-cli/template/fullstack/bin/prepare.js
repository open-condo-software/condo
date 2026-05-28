const path = require('path')

const {
    updateAppEnvFile,
    prepareAppEnvLocalAdminUsers,
    getAppEnvValue,
    // @if OIDC
    prepareCondoAppOidcConfig,
    // @endif
} = require('@open-condo/cli')

const APP_NAME = path.basename(path.resolve(__dirname, '..'))

async function setupBaseConfigs () {
    const condoUrl = await getAppEnvValue(APP_NAME, 'CONDO_DOMAIN')
    await updateAppEnvFile(APP_NAME, 'CONDO_URL', JSON.stringify(condoUrl))
    await updateAppEnvFile(APP_NAME, 'DEFAULT_LOCALE', 'en')
}

async function main () {
    await setupBaseConfigs()

    // @if OIDC
    const oidcConf = await prepareCondoAppOidcConfig(APP_NAME)
    await updateAppEnvFile(APP_NAME, 'OIDC_CONDO_CLIENT_CONFIG', JSON.stringify(oidcConf))
    // @endif

    await prepareAppEnvLocalAdminUsers(APP_NAME)

    console.log('done')
}

main().then(() => process.exit(), (error) => {
    console.error(error)
    process.exit(1)
})
