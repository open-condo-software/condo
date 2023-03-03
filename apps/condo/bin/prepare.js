const { getAppEnvValue, getAppServerUrl, updateAppEnvFile, prepareAppEnvLocalAdminUsers } = require('@open-condo/cli')
const { getRandomString } = require('@open-condo/keystone/test.utils')

async function updateAppEnvAddressSuggestionConfig (serviceName) {
    const addressServiceUrl = await getAppServerUrl('address-service')
    await updateAppEnvFile(serviceName, 'ADDRESS_SERVICE_URL', addressServiceUrl)

    const config = {}
    const currentValue = await getAppEnvValue(serviceName, 'ADDRESS_SUGGESTIONS_CONFIG')
    if (currentValue) {
        const currentValueJson = JSON.parse(currentValue)
        if (currentValueJson.apiUrl) config.apiUrl = currentValueJson.apiUrl
        if (currentValueJson.apiToken) config.apiToken = currentValueJson.apiToken
    }
    if (!config.apiUrl) config.apiUrl = `${addressServiceUrl}/suggest`
    if (!config.apiToken) config.apiToken = getRandomString()

    await updateAppEnvFile(serviceName, 'ADDRESS_SUGGESTIONS_CONFIG', JSON.stringify(config))
}

async function main () {
    // 1) add local admin users!
    const appName = 'condo'
    await prepareAppEnvLocalAdminUsers(appName)
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
