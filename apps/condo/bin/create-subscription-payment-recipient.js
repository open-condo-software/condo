const path = require('path')

const conf = require('@open-condo/config')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { AcquiringIntegration, AcquiringIntegrationContext } = require('@condo/domains/acquiring/utils/serverSchema')
const { DEFAULT_BILLING_INTEGRATION_GROUP } = require('@condo/domains/billing/constants')
const { BillingIntegration } = require('@condo/domains/billing/utils/serverSchema')
const { createTestRecipient } = require('@condo/domains/billing/utils/testSchema')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')

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
        console.info(`Creating organization: ${name}`)
        
        try {
            organization = await Organization.create(context, {
                dv,
                sender,
                name,
                country: 'ru',
                type: 'MANAGING_COMPANY',
                tin: '0000000000',
                meta: { dv: 1 },
            })
            console.info('Organization created!')
        } catch (e) {
            console.error('Failed to create organization:', e)
            if (e.errors) console.error('Errors:', JSON.stringify(e.errors))
            throw e
        }
    }
    
    console.info(`ORGANIZATION ID: ${organization.id}`)

    const existingBillingIntegrations = await BillingIntegration.getAll(context, {
        group: DEFAULT_BILLING_INTEGRATION_GROUP,
        deletedAt: null,
    })

    if (existingBillingIntegrations.length === 0) {
        console.info('Creating BillingIntegration...')
        try {
            await BillingIntegration.create(context, {
                dv,
                sender,
                name: 'Test Billing Integration',
                group: DEFAULT_BILLING_INTEGRATION_GROUP,
                targetDescription: 'Test billing integration for subscription payments',
                bannerColor: '#4CD174',
                bannerTextColor: 'WHITE',
                receiptsLoadingTime: 'Instant',
                currencyCode: 'RUB',
                instruction: 'This is a test billing integration for subscription payments. No setup required.',
                isHidden: true,
                shortDescription: 'Test billing integration for internal subscription payments',
                detailedDescription: 'This integration is used internally for processing subscription payments. It does not require any external setup or configuration.',
            })
            console.info('BillingIntegration created!')
        } catch (e) {
            console.error('Failed to create BillingIntegration:', e)
            if (e.errors) console.error('Errors:', JSON.stringify(e.errors))
            if (e.extensions) console.error('Extensions:', JSON.stringify(e.extensions))
            throw e
        }
    } else {
        console.info('BillingIntegration already exists!')
    }

    const existingContext = await AcquiringIntegrationContext.getOne(context, {
        organization: { id: organization.id },
        deletedAt: null,
    })

    let integration
    if (existingContext) {
        console.info('AcquiringIntegrationContext already exists!')
        integration = await AcquiringIntegration.getOne(context, { id: existingContext.integration })
        console.info(`ACQUIRING INTEGRATION ID: ${integration.id}`)
    } else {
        console.info('Creating AcquiringIntegration...')
        try {
            integration = await AcquiringIntegration.create(context, {
                dv,
                sender,
                name: 'Test Acquiring Integration',
                hostUrl: 'http://localhost:3000',
                canGroupReceipts: true,
                isHidden: true,
                explicitFeeDistributionSchema: [{ recipient: 'acquiring', percent: '0.65', minAmount: '0', maxAmount: '0', category: '' }, { recipient: 'service', percent: '0.55', minAmount: '0', maxAmount: '0', category: '' }],
                vatPercentOptions: '0,5,6,10,15,20',
            })
            console.info('AcquiringIntegration created!')
        } catch (e) {
            console.error('Failed to create AcquiringIntegration:', e)
            if (e.errors) console.error('Errors:', JSON.stringify(e.errors))
            if (e.extensions) console.error('Extensions:', JSON.stringify(e.extensions))
            throw e
        }
        
        console.info(`ACQUIRING INTEGRATION ID: ${integration.id}`)

        console.info('Creating AcquiringIntegrationContext...')
        try {
            await AcquiringIntegrationContext.create(context, {
                dv,
                sender,
                organization: { connect: { id: organization.id } },
                integration: { connect: { id: integration.id } },
                settings: { dv: 1 },
                state: { dv: 1 },
                invoiceStatus: CONTEXT_FINISHED_STATUS,
                invoiceImplicitFeeDistributionSchema: [],
                invoiceRecipient: createTestRecipient(),
            })
            console.info('AcquiringIntegrationContext created!')
        } catch (e) {
            console.error('Failed to create AcquiringIntegrationContext:', e)
            if (e.errors) console.error('Errors:', JSON.stringify(e.errors))
            if (e.extensions) console.error('Extensions:', JSON.stringify(e.extensions))
            throw e
        }
    }

    console.info(organization.id)
    return organization.id
}

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
