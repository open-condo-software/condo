const { get } = require('lodash')

const { makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { BillingRecipientResolver } = require('@condo/domains/billing/schema/helpers/billingRecipientResolver')
const {
    makeContextWithOrganizationAndIntegrationAsAdmin,
    createTestBillingRecipient,
    createRegisterBillingReceiptsPayload,
} = require('@condo/domains/billing/utils/testSchema')
const { BillingRecipient } = require('@condo/domains/billing/utils/testSchema')

let helper = new BillingRecipientResolver()

describe('Logic tests',  () => {
    // valid bank requisites
    const payload = {
        tin: '7744001497',
        routingNumber: '044525823',
        bankAccount: '30101810200000000823',
    }

    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    test('Recipient does not exist, need to create a new one', async () => {
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        context.organization = context.organization.id
        await helper.init(context)

        const receipt = createRegisterBillingReceiptsPayload(payload)

        const [processedReceipt] = await helper.processReceipts([receipt])
        const [createdRecipient] = await BillingRecipient.getAll(admin, {
            id: get(processedReceipt, ['receiver', 'id']),
        })
        await BillingRecipient.softDelete(admin, createdRecipient.id)

        expect(createdRecipient.id).toBeDefined()
        expect(createdRecipient).toHaveProperty('id', processedReceipt.receiver.id)
        expect(createdRecipient).toHaveProperty('tin', payload.tin)
        expect(createdRecipient).toHaveProperty('bic', payload.routingNumber)
        expect(createdRecipient).toHaveProperty('bankAccount', payload.bankAccount)
        expect(createdRecipient.name).toBeDefined()
    })

    test('Recipient exists, but needs updating some fields', async () => {
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        const [recipient] = await createTestBillingRecipient(admin, context, {
            bankAccount: payload.bankAccount,
        })
        context.organization = context.organization.id
        await helper.init(context)
        const receipt = createRegisterBillingReceiptsPayload(payload)
        const [processedReceipt] = await helper.processReceipts([receipt])
        const [updatedRecipient] = await BillingRecipient.getAll(admin, {
            id: get(processedReceipt, ['receiver', 'id']),
        })

        expect(updatedRecipient).toBeDefined()
        expect(updatedRecipient).toHaveProperty('id', processedReceipt.receiver.id)
        expect(updatedRecipient).toHaveProperty('tin', payload.tin)
        expect(updatedRecipient).toHaveProperty('bic', payload.routingNumber)
        expect(updatedRecipient).toHaveProperty('bankAccount', payload.bankAccount)
        expect(updatedRecipient.name).not.toEqual(recipient.name)
        expect(updatedRecipient).toHaveProperty('isApproved', false)
    })

    test('Recipient should have isApproved = true if organization has the same tin as mentioned recipient', async () => {
        const { context } = await makeContextWithOrganizationAndIntegrationAsAdmin({}, { tin: payload.tin })
        context.organization = context.organization.id
        await helper.init(context)
        const receipt = createRegisterBillingReceiptsPayload(payload)
        const [processedReceipt] = await helper.processReceipts([receipt])
        const [createdRecipient] = await BillingRecipient.getAll(admin, {
            id: get(processedReceipt, ['receiver', 'id']),
        })

        expect(createdRecipient).toBeDefined()
        expect(createdRecipient).toHaveProperty('id', processedReceipt.receiver.id)
        expect(createdRecipient).toHaveProperty('isApproved', true)
    })

})