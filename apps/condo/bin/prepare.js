const set = require('lodash/set')

const { getAppServerUrl, updateAppEnvFile, prepareAppEnvLocalAdminUsers, safeExec, getAppEnvValue } = require('@open-condo/cli')

async function updateAppEnvAddressSuggestionConfig (serviceName) {
    const addressServiceUrl = await getAppServerUrl('address-service')
    await updateAppEnvFile(serviceName, 'ADDRESS_SERVICE_URL', addressServiceUrl)
    // NOTE: address-service must be in fake mode by default to pass tests. Later we should prepare address-service instead to work locally!
    await updateAppEnvFile(serviceName, 'FAKE_ADDRESS_SERVICE_CLIENT', 'true')
    await updateAppEnvFile(serviceName, 'FAKE_FINANCE_INFO_CLIENT', 'true')
}

async function updateAppEnvFileClients (appName) {
    await updateAppEnvFile(appName, 'FILE_UPLOAD_CONFIG', (prev) => {
        const newValue = JSON.parse(prev || '{"clients": {}}')
        set(newValue, 'clients.condo', { secret: appName + '-secret' })
        set(newValue, 'clients.miniapp', { secret: appName + '-secret' })

        return JSON.stringify(newValue)
    })
    await updateAppEnvFile(appName, 'FILE_CLIENT_ID', appName)
    await updateAppEnvFile(appName, 'FILE_SECRET', appName + '-secret')
}

async function prepareSubscriptionPaymentRecipient (appName) {
    const existingOrgId = await getAppEnvValue(appName, 'SUBSCRIPTION_PAYMENT_RECIPIENT')
    if (existingOrgId) {
        console.log(`SUBSCRIPTION_PAYMENT_RECIPIENT already set: ${existingOrgId}`)
        return existingOrgId
    }

    const { stdout } = await safeExec(`yarn workspace @app/${appName} node ./bin/create-subscription-payment-recipient.js "Subscription Payment Recipient"`)
    const organizationId = stdout.trim().split('\n').pop()
    await updateAppEnvFile(appName, 'SUBSCRIPTION_PAYMENT_RECIPIENT', organizationId)
    console.log(`SUBSCRIPTION_PAYMENT_RECIPIENT=${organizationId}`)
    return organizationId
}

async function main () {
    // 1) add local admin users!
    const appName = 'condo'
    await prepareAppEnvLocalAdminUsers(appName)
    await updateAppEnvAddressSuggestionConfig(appName)
    await updateAppEnvFileClients(appName)
    await prepareSubscriptionPaymentRecipient(appName)
    console.log('done')
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
