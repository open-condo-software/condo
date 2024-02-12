/**
 * @jest-environment node
 */
const { Readable } = require('stream')

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')
const Upload = require('graphql-upload/Upload.js')

const conf = require('@open-condo/config')
const {
    setFakeClientMode,
    makeLoggedInAdminClient, makeClient, UploadingFile,
} = require('@open-condo/keystone/test.utils')


const { BillingReceiptFile } = require('@condo/domains/billing/utils/serverSchema')
const { Message } = require('@condo/domains/notification/utils/serverSchema')
const { BILLING_RECEIPT_FILE_ADDED_TYPE } = require('@condo/domains/notification/constants/constants')
const {
    makeContextWithOrganizationAndIntegrationAsAdmin,
    createTestBillingProperty,
    createTestBillingAccount,
    createTestBillingReceipt,
    createTestBillingReceiptFile,
    updateTestBillingReceipt,
} = require('@condo/domains/billing/utils/testSchema')
const { createTestContact } = require('@condo/domains/contact/utils/testSchema')
const {
    createTestProperty,
} = require('@condo/domains/property/utils/testSchema')

const { sendNewBillingReceiptFilesNotifications } = require('./sendNewBillingReceiptFilesNotifications')

const { keystone } = index
const sender = { dv: 1, fingerprint: 'test-billing-receipt-files' }

function wait (timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout)
    })
}

async function createFile (filename, mimetype, content) {
    const stream = Readable.from(content)

    const upload = new Upload()
    upload.resolve({
        // Normally this would be a createReadStream function pointed to a file,
        // but our function creates a Readable object pointed at our in-memory buffer instead
        createReadStream: () => stream,
        // These three properties can be customised, but must exist for validation
        filename,
        mimetype,
        encoding: 'utf-8',
    })

    return upload
}

async function createBillingReceiptFile (adminContext, receipt, context, extraAttrs) {
    const receiptConnection = receipt ? { receipt: { connect: { id: receipt.id } } } : {}
    const contextConnection = { context: { connect: { id: context.id } } }
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const attrs = {
        dv: 1,
        sender,
        sensitiveDataFile: await createFile('sensitiveDataFile.txt', 'text/plain', 'sensitiveDataFile'),
        publicDataFile: await createFile('publicDataFile.txt', 'text/plain', 'publicDataFile'),
        controlSum: faker.random.alphaNumeric(20),
        ...receiptConnection,
        ...contextConnection,
        ...extraAttrs,
    }
    return await BillingReceiptFile.create(adminContext, attrs)
}

describe('sendNewBillingReceiptFilesNotifications', () => {
    setFakeClientMode(index)

    describe('Sent notifications cases', () => {

        let admin
        let adminContext
        let context
        let receiptByAdmin
        let property
        let account
        let organization
        let organizationProperty

        beforeEach(async () => {
            adminContext = await keystone.createContext({ skipAccessControl: true })

            const {
                admin: adminClient,
                context: billingContext,
                organization: adminOrganization,
            } = await makeContextWithOrganizationAndIntegrationAsAdmin()
            admin = adminClient
            context = billingContext
            organization = adminOrganization
            const [firstProperty] = await createTestBillingProperty(admin, context)
            const [firstAccount] = await createTestBillingAccount(admin, context, firstProperty)
            const [orgProperty] = await createTestProperty(admin, organization, {
                address: firstProperty.address,
                addressMeta: firstProperty.addressMeta,
            })
            organizationProperty = orgProperty
            property = firstProperty
            account = firstAccount
            const [receipt] = await createTestBillingReceipt(admin, context, property, account)
            receiptByAdmin = receipt
        })

        it('success case', async () => {
            const watermark = dayjs().toISOString()
            const billingReceiptFile = await createBillingReceiptFile(adminContext, receiptByAdmin, context)
            console.log(billingReceiptFile)
            const [contact] = await createTestContact(admin, organization, organizationProperty, {
                unitName: account.unitName,
                unitType: account.unitType,
                isVerified: true,
            })

            await sendNewBillingReceiptFilesNotifications({
                organizationId: organization.id,
                organizationName: organization.name,
                sender,
                period: receiptByAdmin.period,
                watermark,
            })

            // assert sent notifications count
            // check notification message
            const messages = await Message.getAll(adminContext, {
                type: BILLING_RECEIPT_FILE_ADDED_TYPE,
                email: contact.email,
            }, { sortBy: 'createdAt_DESC' })
            const [message] = messages

            expect(message).toHaveProperty('email', contact.email)
            expect(message).toHaveProperty('meta')
            expect(message.meta).toHaveProperty('data')
            expect(message.meta.data).toMatchObject({
                organization: organization.name,
            })
        })
    })

    describe('No created notification cases', () => {
        let admin
        let adminContext
        let context
        let receiptByAdmin
        let property
        let account
        let organization
        let organizationProperty

        beforeAll(async () => {
            adminContext = await keystone.createContext({ skipAccessControl: true })

            const {
                admin: adminClient,
                context: billingContext,
                organization: adminOrganization,
            } = await makeContextWithOrganizationAndIntegrationAsAdmin()
            admin = adminClient
            context = billingContext
            organization = adminOrganization
            const [firstProperty] = await createTestBillingProperty(admin, context)
            const [firstAccount] = await createTestBillingAccount(admin, context, firstProperty)
            const [orgProperty] = await createTestProperty(admin, organization, {
                address: firstProperty.address,
                addressMeta: firstProperty.addressMeta,
            })
            organizationProperty = orgProperty
            property = firstProperty
            account = firstAccount
            const [receipt] = await createTestBillingReceipt(admin, context, property, account)
            receiptByAdmin = receipt
        })

        it('Watermark filtering out files', async () => {
            const watermark = dayjs().add(1, 'hours').toISOString()
            const billingReceiptFile = await createBillingReceiptFile(adminContext, receiptByAdmin, context)
            const [contact] = await createTestContact(admin, organization, organizationProperty, {
                unitName: account.unitName,
                unitType: account.unitType,
                isVerified: true,
            })

            await sendNewBillingReceiptFilesNotifications({
                organizationId: organization.id,
                organizationName: organization.name,
                sender,
                period: receiptByAdmin.period,
                watermark,
            })

            // assert sent notifications count
            // check notification message
            const messages = await Message.getAll(adminContext, {
                type: BILLING_RECEIPT_FILE_ADDED_TYPE,
                email: contact.email,
            }, { sortBy: 'createdAt_DESC' })

            expect(messages).toHaveLength(0)
        })

        it('BillingReceipt was deleted', async () => {
            const watermark = dayjs().toISOString()
            const [billingProperty] = await createTestBillingProperty(admin, context)
            const [billingReceipt] = await createTestBillingReceipt(admin, context, billingProperty, account)
            const billingReceiptFile = await createBillingReceiptFile(adminContext, billingReceipt, context)
            const [orgProperty] = await createTestProperty(admin, organization, {
                address: billingProperty.address,
                addressMeta: billingProperty.addressMeta,
            })
            const [contact] = await createTestContact(admin, organization, orgProperty, {
                unitName: account.unitName,
                unitType: account.unitType,
                isVerified: true,
            })

            // deleted receipt
            await updateTestBillingReceipt(admin, billingReceipt.id, {
                deletedAt: dayjs().toISOString(),
            })

            await sendNewBillingReceiptFilesNotifications({
                organizationId: organization.id,
                organizationName: organization.name,
                sender,
                period: receiptByAdmin.period,
                watermark,
            })

            // assert sent notifications count
            // check notification message
            const messages = await Message.getAll(adminContext, {
                type: BILLING_RECEIPT_FILE_ADDED_TYPE,
                email: contact.email,
            }, { sortBy: 'createdAt_DESC' })

            expect(messages).toHaveLength(0)
        })

        test('No verified contacts', async () => {
            const watermark = dayjs().toISOString()
            const [billingProperty] = await createTestBillingProperty(admin, context)
            const [billingReceipt] = await createTestBillingReceipt(admin, context, billingProperty, account)
            const billingReceiptFile = await createBillingReceiptFile(adminContext, billingReceipt, context)
            const [orgProperty] = await createTestProperty(admin, organization, {
                address: billingProperty.address,
                addressMeta: billingProperty.addressMeta,
            })
            const [contact] = await createTestContact(admin, organization, orgProperty, {
                unitName: account.unitName,
                unitType: account.unitType,
                isVerified: false,
            })

            await sendNewBillingReceiptFilesNotifications({
                organizationId: organization.id,
                organizationName: organization.name,
                sender,
                period: receiptByAdmin.period,
                watermark,
            })

            // assert sent notifications count
            // check notification message
            const messages = await Message.getAll(adminContext, {
                type: BILLING_RECEIPT_FILE_ADDED_TYPE,
                email: contact.email,
            }, { sortBy: 'createdAt_DESC' })

            expect(messages).toHaveLength(0)
        })
    })
})