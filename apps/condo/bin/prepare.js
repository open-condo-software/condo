const { getAppServerUrl, updateAppEnvFile, prepareAppEnvLocalAdminUsers } = require('@open-condo/cli')
const { generateUUIDv4 } = require('@open-condo/miniapp-utils')

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
            condo: { secret: generateUUIDv4() },
            miniapp: { secret: generateUUIDv4() },
        },
    }))
}

async function main () {
    // 1) add local admin users!
    const appName = 'condo'
    await prepareAppEnvLocalAdminUsers(appName)
    await updateAppEnvAddressSuggestionConfig(appName)
    await updateAppEnvFileClients(appName)
    console.log('done')
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
