const path = require('path')

const { faker } = require('@faker-js/faker')

const { prepareAppEnvLocalAdminUsers, getAppEnvValue, updateAppEnvFile, safeExec } = require('@open-condo/cli')

const APP_NAME = path.basename(path.resolve(__dirname, '..'))
const BOT_RIGHTS_SET = JSON.stringify({
    name: '[DEV-API] Service bot permissions',
    canReadB2BApps: true,
    canReadB2BAppAccessRights: true,
    canReadB2BAppAccessRightSets: true,
    canReadB2BAppPermissions: true,
    canReadB2BAppNewsSharingConfigs: true,
    canReadB2CApps: true,
    canReadB2CAppAccessRights: true,
    canReadB2CAppBuilds: true,
    canReadB2CAppProperties: true,
    canReadOidcClients: true,
    canReadUsers: true,
    canReadUserEmailField: true,

    canManageB2BApps: true,
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
    await prepareAppEnvLocalAdminUsers(APP_NAME, 'phone')

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

    const devBotOptions = JSON.stringify({ type: 'service', password: devBotConfig.password, name: '[DEV-API] Dev bot' })
    const prodBotOptions = JSON.stringify({ type: 'service', password: prodBotConfig.password, name: '[DEV-API] Prod bot' })
    await safeExec(`yarn workspace @app/condo node bin/create-user.js ${JSON.stringify(devBotConfig.email)} ${JSON.stringify(devBotOptions)} ${JSON.stringify(BOT_RIGHTS_SET)}`)
    await safeExec(`yarn workspace @app/condo node bin/create-user.js ${JSON.stringify(prodBotConfig.email)} ${JSON.stringify(prodBotOptions)} ${JSON.stringify(BOT_RIGHTS_SET)}`)
}

main().then(() => {
    console.log('done')
    process.exit()
}).catch((err) => {
    console.error(err)
    process.exit(1)
})
