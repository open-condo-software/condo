const path = require('path')

const faker = require('faker')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const { BillingIntegration, BillingIntegrationAccessRight } = require('@condo/domains/billing/utils/serverSchema')
const { User } = require('@condo/domains/user/utils/serverSchema')

function getJson (data) {
    try {
        return JSON.parse(data)
    } catch (e) {
        return undefined
    }
}

async function main (args) {
    const [email, name, options] = args
    let optionsJson = getJson(options)
    if (!name) throw new Error('use: create-billing-app <name> [<options>]')
    if (options && !optionsJson) throw new Error('<options> argument should be a valid json')
    if (options && !optionsJson.appUrl) throw new Error('<options> argument should have appUrl key')
    const json = optionsJson || {}

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    console.info(`NAME: ${name}`)

    let [billing_integration] = await BillingIntegration.getAll(context, { name }, { first: 1, sortBy: ['createdAt_DESC'] })
    const user = await User.getOne(context, { email })

    if (user.type !== 'service') {
        throw new Error('User is not of service type')
    }

    if (!json.dv) json.dv = 1
    if (!json.sender) json.sender = { 'dv': 1, 'fingerprint': 'create-billing_integration-script' }
    if (!billing_integration) {
        if (!json.contextDefaultStatus) json.contextDefaultStatus = 'Finished'
        if (!json.category) json.category = 'OTHER'
        if (!json.developer) json.developer = 'InternalDeveloper'
        if (!json.shortDescription) json.shortDescription = faker.commerce.productDescription()
        if (!json.detailedDescription) json.detailedDescription = faker.lorem.paragraphs(5)
        if (!json.billingPageTitle) json.billingPageTitle = name
        if (!json.group) json.group = 'local'
        if (!json.currencyCode) json.currencyCode = 'RUB'

        billing_integration = await BillingIntegration.create(context, {
            name, ...json,
        })
        console.info('billing_integration created!')
    } else {
        await BillingIntegration.update(context, billing_integration.id, json)
        console.info('billing_integration updated!')
    }

    const [billing_integration_access] = await BillingIntegrationAccessRight.getOne(context, { user: { id: user.id }, integration: { id: billing_integration.id } } )
    if (!billing_integration_access) {
        await BillingIntegrationAccessRight.create(context, { user: { connect: { id: user.id } }, integration: { connect: { id: billing_integration.id } }, dv: 1, sender: { 'dv': 1, 'fingerprint': 'create-billing_integration-script' } } )
    }
}

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
