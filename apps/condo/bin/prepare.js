const { execSync } = require('child_process')

const { getAppServerUrl, updateAppEnvFile, getAppEnvValue, prepareAppEnvLocalAdminUsers } = require('@open-condo/cli')

async function updateAppEnvAddressSuggestionConfig (serviceName) {
    const addressServiceUrl = await getAppServerUrl('address-service')
    await updateAppEnvFile(serviceName, 'ADDRESS_SERVICE_URL', addressServiceUrl)
    // NOTE: address-service must be in fake mode by default to pass tests. Later we should prepare address-service instead to work locally!
    await updateAppEnvFile(serviceName, 'FAKE_ADDRESS_SERVICE_CLIENT', 'true')
    await updateAppEnvFile(serviceName, 'FAKE_FINANCE_INFO_CLIENT', 'true')
}

async function updateAppEnvFileClients (appName) {
    await updateAppEnvFile(appName, 'FILE_UPLOAD_CONFIG', JSON.stringify({
        clients: {
            condo: { secret: appName + '-secret' },
            miniapp: { secret: appName + '-secret' },
        },
    }))
    await updateAppEnvFile(appName, 'FILE_CLIENT_ID', appName)
    await updateAppEnvFile(appName, 'FILE_SECRET', appName + '-secret')
}

async function prepareNatsKeys (appName) {
    const existingSeed = await getAppEnvValue(appName, 'NATS_AUTH_ACCOUNT_SEED')
    if (existingSeed) return

    const output = execSync('yarn workspace @open-condo/nats generate-nats-keys --json', { encoding: 'utf-8' })
    const { seed, publicKey } = JSON.parse(output)

    await updateAppEnvFile(appName, 'NATS_AUTH_ACCOUNT_SEED', seed)
    await updateAppEnvFile(appName, 'NATS_AUTH_ISSUER', publicKey)
    console.log('[NATS] Generated auth callout NKey pair')
}

async function main () {
    // 1) add local admin users!
    const appName = 'condo'
    await prepareAppEnvLocalAdminUsers(appName)
    await updateAppEnvAddressSuggestionConfig(appName)
    await updateAppEnvFileClients(appName)
    await prepareNatsKeys(appName)
    console.log('done')
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
