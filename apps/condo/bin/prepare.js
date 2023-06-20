const { getAppServerUrl, updateAppEnvFile, prepareAppEnvLocalAdminUsers, safeExec } = require('@open-condo/cli')
const { getRandomString } = require('@open-condo/keystone/test.utils')

async function updateAppEnvAddressSuggestionConfig (serviceName) {
    const addressServiceUrl = await getAppServerUrl('address-service')
    await updateAppEnvFile(serviceName, 'ADDRESS_SERVICE_URL', addressServiceUrl)
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
