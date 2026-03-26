const path = require('path')

const conf = require('@open-condo/config')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { AcquiringIntegration, AcquiringIntegrationContext } = require('@condo/domains/acquiring/utils/serverSchema')
const { Organization, registerNewOrganization } = require('@condo/domains/organization/utils/serverSchema')

async function main (args) {
    const [name] = args
    if (!name) throw new Error('use: create-subscription-payment-recipient <name>')

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    const dv = 1
    const sender = { dv: 1, fingerprint: 'create-subscription-payment-recipient' }

    const existingOrgId = conf.SUBSCRIPTION_PAYMENT_RECIPIENT
    let organization

    if (existingOrgId) {
        console.info(`Checking existing organization ID from env: ${existingOrgId}`)
        organization = await Organization.getOne(context, { id: existingOrgId, deletedAt: null })
        
        if (organization) {
            console.info('Organization already exists!')
        } else {
            console.warn(`Organization with ID ${existingOrgId} not found, creating new one`)
            organization = null
        }
    }

    if (!organization) {
        console.info(`ORGANIZATION NAME: ${name}`)
        try {
            organization = await registerNewOrganization(context, {
                dv,
                sender,
                name,
                country: 'ru',
                type: 'MANAGING_COMPANY',
                tin: '0000000000',
                meta: { dv: 1 },
            })
        } catch (e) {
            console.info('err', e.errors, JSON.stringify(e.errors))
            return
        }
     
        console.info('Organization created!')
    }
    console.info(`ORGANIZATION ID: ${organization.id}`)

    const existingContext = await AcquiringIntegrationContext.getOne(context, {
        organization: organization.id,
        deletedAt: null,
    })

    let integration
    if (existingContext) {
        console.info('AcquiringIntegrationContext already exists!')
        integration = await AcquiringIntegration.getOne(context, { id: existingContext.integration })
        console.info(`ACQUIRING INTEGRATION ID: ${integration.id}`)
    } else {
        const integrationName = 'Test Acquiring Integration'
        integration = await AcquiringIntegration.getOne(context, { name: integrationName })
        
        if (integration) {
            console.info('AcquiringIntegration already exists!')
        } else {
            integration = await AcquiringIntegration.create(context, {
                dv,
                sender,
                name: integrationName,
                hostUrl: 'http://localhost:3000',
            })
            console.info('AcquiringIntegration created!')
        }
        console.info(`ACQUIRING INTEGRATION ID: ${integration.id}`)

        await AcquiringIntegrationContext.create(context, {
            dv,
            sender,
            organization: { connect: { id: organization.id } },
            integration: { connect: { id: integration.id } },
            settings: { dv: 1 },
            invoiceStatus: CONTEXT_FINISHED_STATUS,
            invoiceImplicitFeeDistributionSchema: [],
        })
        console.info('AcquiringIntegrationContext created!')
    }

    return organization.id
}

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
