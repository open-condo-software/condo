const path = require('path')

const { faker } = require('@faker-js/faker')

const {
    prepareCondoAppOidcConfig,
    prepareAppEnvLocalAdminUsers,
    getAppEnvValue,
    updateAppEnvFile,
    safeExec,
} = require('@open-condo/cli')

const APP_NAME = path.basename(path.resolve(__dirname, '..'))
const BOT_RIGHTS_SET = JSON.stringify({
    name: '[DEV-PORTAL] Service bot permissions',
    canReadB2BApps: true,
    canReadB2BAppContexts: true,
    canReadB2BAppAccessRights: true,
    canReadB2BAppAccessRightSets: true,
    canReadB2BAppPermissions: true,
    canReadB2BAppNewsSharingConfigs: true,
    canReadB2CApps: true,
    canReadB2CAppAccessRights: true,
    canReadB2CAppBuilds: true,
    canReadB2CAppProperties: true,
    canReadOidcClients: true,
    canReadOrganizations: true,
    canReadUsers: true,
    canReadUserEmailField: true,

    canManageB2BApps: true,
    canManageB2BAppContexts: true,
    canManageB2BAppAccessRights: true,
    canManageB2BAppAccessRightSets: true,
    canManageB2BAppPermissions: true,
    canManageB2BAppNewsSharingConfigs: true,
    canManageB2CApps: true,
    canManageB2CAppAccessRights: true,
    canManageB2CAppBuilds: true,
    canManageB2CAppProperties: true,
    canManageOidcClients: true,

    canExecuteRegisterNewServiceUser: true,
    canExecuteSendMessage: true,
})

async function main () {
    // STEP 1. Register local users
    await prepareAppEnvLocalAdminUsers(APP_NAME, 'phone')

    // STEP 2. Register bots
    const condoUrl = await getAppEnvValue(APP_NAME, 'CONDO_DOMAIN')
    const devBotEnvValue = await getAppEnvValue(APP_NAME, 'CONDO_DEV_BOT_CONFIG')
    const devBotConfig = devBotEnvValue ? JSON.parse(devBotEnvValue) : {
        email: 'dev-bot@dev.api',
        password: faker.internet.password(16),
    }
    devBotConfig.apiUrl = `${condoUrl}/admin/api`
    await updateAppEnvFile(APP_NAME, 'CONDO_DEV_BOT_CONFIG', JSON.stringify(devBotConfig))

    const prodBotEnvValue = await getAppEnvValue(APP_NAME, 'CONDO_PROD_BOT_CONFIG')
    const prodBotConfig = prodBotEnvValue ? JSON.parse(prodBotEnvValue) : {
        email: 'prod-bot@dev.api',
        password: faker.internet.password(16),
    }
    prodBotConfig.apiUrl = `${condoUrl}/admin/api`
    await updateAppEnvFile(APP_NAME, 'CONDO_PROD_BOT_CONFIG', JSON.stringify(prodBotConfig))

    const devBotOptions = JSON.stringify({ type: 'service', password: devBotConfig.password, name: '[DEV-PORTAL] Dev bot' })
    const prodBotOptions = JSON.stringify({ type: 'service', password: prodBotConfig.password, name: '[DEV-PORTAL] Prod bot' })
    await safeExec(`yarn workspace @app/condo node bin/create-user.js ${JSON.stringify(devBotConfig.email)} ${JSON.stringify(devBotOptions)} ${JSON.stringify(BOT_RIGHTS_SET)}`)
    await safeExec(`yarn workspace @app/condo node bin/create-user.js ${JSON.stringify(prodBotConfig.email)} ${JSON.stringify(prodBotOptions)} ${JSON.stringify(BOT_RIGHTS_SET)}`)

    // STEP 3. Register OIDC client
    const portalWebDomain = await getAppEnvValue(APP_NAME, 'DEV_PORTAL_WEB_DOMAIN')
    const redirectUrl = `${portalWebDomain}/api/oidc/callback`
    const oidcConf = await prepareCondoAppOidcConfig(APP_NAME, { redirectUrl })
    await updateAppEnvFile(APP_NAME, 'OIDC_CONDO_CLIENT_CONFIG', JSON.stringify({ ...oidcConf, scope: 'openid phone' }))
}

main().then(() => {
    console.log('done')
    process.exit()
}).catch((err) => {
    console.error(err)
    process.exit(1)
})
