const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { registerBillingReceiptsByTestClient } = require('@condo/domains/billing/utils/testSchema')
const {
    createTestBillingIntegration,
    updateTestBillingIntegration,
    updateTestBillingIntegrationOrganizationContext,
    createTestBillingIntegrationOrganizationContext,
    generateServicesData,
    createTestBillingIntegrationAccessRight,
    createTestBillingReceiptFile,
} = require('@condo/domains/billing/utils/testSchema')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')

const { OrganizationTestMixin } = require('./organization')
const { PropertyTestMixin } = require('./property')


/**
 * @typedef {Object} BillingTestMixinType
 * @property {Object} billingIntegration - new billing integration
 * @property {Object} billingContext - billing context
 * @property {Object} clients
 * @property {Function} createValidELS - Creates a valid globalId for billing account
 * @property {Function} createRecipient - Creates a recipient structure
 * @property {Function} createJSONReceipt - Creates a json structure for one receipt to use in unified mutation
 * @property {async} initMixin - Initializes the mixin
 * @property {async} createReceipts - Calls the unified mutation to register receipts
 * @property {async} createBillingReceiptFile - Creates a  BillingReceiptFile
 * @property {async} updateBillingContext - Updates billingContext
 * @property {async} updateBillingIntegration - Updates billingIntegration
 */

/**
 * This provides billing specific methods for cross-domains tests
 * @mixin
 */
const BillingTestMixin = {

    dependsOn: [OrganizationTestMixin, PropertyTestMixin],

    async initMixin () {
        await this.createEmployee('billing', {
            canManageIntegrations: true,
            canReadBillingReceipts: true,
            canReadPayments: true,
        })
        const [billingIntegration] = await createTestBillingIntegration(this.clients.admin)
        const [billingContext] = await createTestBillingIntegrationOrganizationContext(this.clients.admin, this.organization, billingIntegration, {
            status: CONTEXT_FINISHED_STATUS,
        })
        await createTestBillingIntegrationAccessRight(this.clients.admin, billingIntegration, this.clients.service.user)
        this.billingIntegration = billingIntegration
        this.billingContext = billingContext
    },

    createPeriod (monthsModifier = 0) {
        const period = dayjs().add(monthsModifier, 'month').format('YYYY-MM-01')
        const [year, month] = period.split('-').map(Number)
        return { period, year, month }
    },

    randomNumber (numDigits) {
        const min = 10 ** (numDigits - 1)
        const max = 10 ** numDigits - 1
        return faker.datatype.number({ min, max })
    },

    createValidELS () {
        return `${this.randomNumber(2)}БГ${this.randomNumber(6)}`
    },

    createRecipient (extra = {}) {
        return {
            tin: faker.random.numeric(8),
            routingNumber: faker.random.numeric(5),
            bankAccount: faker.random.numeric(12),
            ...extra,
        }
    },

    createJSONReceipt (extra = {}) {
        const [month, year] = dayjs().add(-1, 'month').format('MM-YYYY').split('-').map(Number)
        return Object.fromEntries(Object.entries({
            importId: faker.datatype.uuid(),
            address: this.createAddressWithUnit(),
            accountNumber: this.randomNumber(10).toString(),
            toPay: faker.finance.amount(-100, 5000),
            month,
            year,
            services: generateServicesData(faker.datatype.number({ min: 3, max: 5 })),
            ...this.createRecipient(),
            raw: extra,
            ...extra,
        }).filter(([, value]) => !!value))
    },

    async createReceipts (jsonReceipts) {
        if (!jsonReceipts) {
            jsonReceipts = [this.createJSONReceipt()]
        }
        return await registerBillingReceiptsByTestClient(this.clients.admin, {
            context: { id: this.billingContext.id },
            receipts: jsonReceipts,
        })
    },

    async createBillingReceiptFile (receiptId, extra = {}) {
        return await createTestBillingReceiptFile(this.clients.admin, { id: receiptId }, this.billingContext, extra)
    },

    async updateBillingContext (updateInput) {
        return await updateTestBillingIntegrationOrganizationContext(this.clients.admin, this.billingContext.id, updateInput)
    },

    async updateBillingIntegration (updateInput) {
        return await updateTestBillingIntegration(this.clients.admin, this.billingIntegration.id, updateInput)
    },

}

module.exports = {
    BillingTestMixin,
}