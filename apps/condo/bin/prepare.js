const { getAppServerUrl, updateAppEnvFile, prepareAppEnvLocalAdminUsers, safeExec } = require('@open-condo/cli')
const { getRandomString } = require('@open-condo/keystone/test.utils')

async function updateAppEnvAddressSuggestionConfig (serviceName) {
    const addressServiceUrl = await getAppServerUrl('address-service')
    await updateAppEnvFile(serviceName, 'ADDRESS_SERVICE_URL', addressServiceUrl)
}

async function prepareAppEnvCypressConfig (appName) {
    if (appName !== 'condo') { throw new Error(`Can't configure Cypress support user for ${appName}. Cypress support user configuration is only available for condo app`) }
    const CYPRESS_SERVER_SUPPORT_EMAIL = 'service.condo.cypress.tests@example.com'
    const CYPRESS_SERVER_SUPPORT_PASSWORD = getRandomString()
    const CYPRESS_SERVER_SUPPORT_OPTS = JSON.stringify({ password: CYPRESS_SERVER_SUPPORT_PASSWORD, isSupport: true, isAdmin: false, name: 'CypressSupportUser' })
    await safeExec(`yarn workspace @app/${appName} node ./bin/create-user.js ${CYPRESS_SERVER_SUPPORT_EMAIL} ${JSON.stringify(CYPRESS_SERVER_SUPPORT_OPTS)}`)
    await updateAppEnvFile(appName, 'CYPRESS_SERVER_SUPPORT_EMAIL', CYPRESS_SERVER_SUPPORT_EMAIL)
    await updateAppEnvFile(appName, 'CYPRESS_SERVER_SUPPORT_PASSWORD', CYPRESS_SERVER_SUPPORT_PASSWORD)
}

async function main () {
    // 1) add local admin users!
    const appName = 'condo'
    await prepareAppEnvLocalAdminUsers(appName)
    //await prepareAppEnvCypressConfig(appName)
    await updateAppEnvAddressSuggestionConfig(appName)
    console.log('done')
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
