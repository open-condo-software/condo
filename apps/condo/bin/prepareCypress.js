const { safeExec, updateAppEnvFile } = require('@open-condo/cli')
const { getRandomString } = require('@open-condo/keystone/test.utils')

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
    await prepareAppEnvCypressConfig('condo')
    console.log('Cypress users are created and set to environment')
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
