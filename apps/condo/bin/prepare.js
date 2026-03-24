const { getAppServerUrl, updateAppEnvFile, prepareAppEnvLocalAdminUsers, safeExec, getAppEnvValue } = require('@open-condo/cli')

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

async function createSubscriptionPaymentRecipient (appName) {
    const existingOrgId = await getAppEnvValue(appName, 'SUBSCRIPTION_PAYMENT_RECIPIENT')
    
    if (existingOrgId) {
        console.log('Subscription payment recipient already configured:', existingOrgId)
        return existingOrgId
    }

    const orgName = 'Subscription Payment Recipient'
    const orgOptions = JSON.stringify({ country: 'ru', type: 'MANAGING_COMPANY' })
    const { stdout } = await safeExec(`yarn workspace @app/${appName} node ./bin/create-organization.js ${JSON.stringify(orgName)} ${JSON.stringify(orgOptions)}`)
    
    const lines = stdout.trim().split('\n')
    const idLine = lines.find(line => line.includes('ORGANIZATION ID:'))
    if (!idLine) {
        throw new Error('Failed to get organization ID from create-organization script')
    }
    
    const orgId = idLine.split('ORGANIZATION ID:')[1].trim()
    await updateAppEnvFile(appName, 'SUBSCRIPTION_PAYMENT_RECIPIENT', orgId)
    console.log('Subscription payment recipient organization configured:', orgId)
    return orgId
}

async function main () {
    // 1) add local admin users!
    const appName = 'condo'
    await prepareAppEnvLocalAdminUsers(appName)
    await updateAppEnvAddressSuggestionConfig(appName)
    await updateAppEnvFileClients(appName)
    await createSubscriptionPaymentRecipient(appName)
    console.log('done')
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
