const { faker } = require('@faker-js/faker')

const conf = require('@open-condo/config')
const { find } = require('@open-condo/keystone/schema')
const { makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { createTestAcquiringIntegration, createTestAcquiringIntegrationContext } = require('@condo/domains/acquiring/utils/testSchema')
const { DEFAULT_BILLING_INTEGRATION_GROUP } = require('@condo/domains/billing/constants')
const { createTestBillingIntegration, BillingIntegration, createTestRecipient } = require('@condo/domains/billing/utils/testSchema')
const { MANAGING_COMPANY_TYPE } = require('@condo/domains/organization/constants/common')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema')

/**
 * Gets subscription payment recipient organization ID and acquiring integration.
 * 
 * In test mode (USE_FAKE_SUBSCRIPTION_PAYMENT_RECIPIENT=true):
 * - Creates temporary organization, billing integration, and acquiring integration
 * - Uses test utilities (makeLoggedInAdminClient, registerNewOrganization, etc.)
 * 
 * In production mode:
 * - Returns SUBSCRIPTION_PAYMENT_RECIPIENT from config
 * - Finds acquiring integration using find
 * 
 * @returns {Promise<{recipientOrgId: string, acquiringIntegration: object}>}
 */
async function getSubscriptionPaymentRecipient () {
    const useFake = conf['USE_FAKE_SUBSCRIPTION_PAYMENT_RECIPIENT'] === 'true'

    if (!useFake) {
        const recipientOrgId = conf['SUBSCRIPTION_PAYMENT_RECIPIENT']
        
        if (!recipientOrgId) {
            return { recipientOrgId: null, acquiringIntegration: null }
        }
        
        const acquiringIntegrationContexts = await find('AcquiringIntegrationContext', {
            organization: { id: recipientOrgId },
            deletedAt: null,
        })

        let acquiringIntegration = null
        if (acquiringIntegrationContexts.length > 0) {
            const integrationId = acquiringIntegrationContexts[0].integration
            const acquiringIntegrations = await find('AcquiringIntegration', {
                id: integrationId,
                deletedAt: null,
            })
            acquiringIntegration = acquiringIntegrations[0] || null
        }

        return { recipientOrgId, acquiringIntegration }
    }

    // Fake mode - create test data
    const client = await makeLoggedInAdminClient()
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    
    const [org] = await registerNewOrganization(client, {
        dv: 1,
        sender,
        country: 'ru',
        type: MANAGING_COMPANY_TYPE,
        tin: '0000000000',
        meta: { dv: 1 },
    })
    const organizationId = org.id

    const existingBillingIntegrations = await BillingIntegration.getAll(client, {
        group: DEFAULT_BILLING_INTEGRATION_GROUP,
        deletedAt: null,
    })
    if (existingBillingIntegrations.length === 0) {
        await createTestBillingIntegration(client)
    }

    const [integration] = await createTestAcquiringIntegration(client, { hostUrl: 'http://localhost:3000' })
    await createTestAcquiringIntegrationContext(client, org, integration, {
        invoiceStatus: CONTEXT_FINISHED_STATUS,
        invoiceRecipient: createTestRecipient(),
        invoiceImplicitFeeDistributionSchema: [],
    })

    return { recipientOrgId: organizationId, acquiringIntegration: integration }
}

module.exports = {
    getSubscriptionPaymentRecipient,
}
