const path = require('path')

const { prepareCondoAppOidcConfig, updateAppEnvFile, prepareAppEnvLocalAdminUsers, getAppEnvValue, safeExec } = require('@open-condo/cli')

const APP_NAME = path.basename(path.resolve(__dirname, '..'))

async function setupBaseConfigs () {
    const condoUrl = await getAppEnvValue(APP_NAME, 'CONDO_DOMAIN')
    await updateAppEnvFile(APP_NAME, 'CONDO_URL', JSON.stringify(condoUrl))
}

async function main () {
    // base configs
    await setupBaseConfigs()

    // oidc configs
    const oidcConf = await prepareCondoAppOidcConfig(APP_NAME)
    await updateAppEnvFile(APP_NAME, 'OIDC_CONDO_CLIENT_CONFIG', JSON.stringify(oidcConf))
    await prepareAppEnvLocalAdminUsers(APP_NAME)

    console.log('done')
}

main().then(() => process.exit(), (error) => {
    console.error(error)
    process.exit(1)
})
