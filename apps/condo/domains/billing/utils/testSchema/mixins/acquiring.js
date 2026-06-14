const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const {
    ACQUIRING_INTEGRATION_EXTERNAL_IMPORT_TYPE,
    ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE,
} = require('@condo/domains/acquiring/constants/integration')

const {
    PAYMENT_DONE_STATUS,
    MULTIPAYMENT_DONE_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const {
    createTestAcquiringIntegration,
    createTestAcquiringIntegrationAccessRight,
    createTestAcquiringIntegrationContext,
    updateTestAcquiringIntegrationContext,
    updateTestAcquiringIntegration,
    registerMultiPaymentByTestClient,
    registerMultiPaymentForVirtualReceiptByTestClient,
    updateTestPayment,
    updateTestMultiPayment,
    MultiPayment,
    registerExternalPaymentsByTestClient,
} = require('@condo/domains/acquiring/utils/testSchema')
const { DEFAULT_CURRENCY_CODE } = require('@condo/domains/common/constants/currencies')

const { OrganizationTestMixin } = require('./organization')

const AcquiringTestMixin = {

    dependsOn: [OrganizationTestMixin],

    async initMixin () {
        const [acquiringIntegration] = await createTestAcquiringIntegration(this.clients.admin, { type: ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE })
        const [externalImportIntegration] = await createTestAcquiringIntegration(this.clients.admin, { type: ACQUIRING_INTEGRATION_EXTERNAL_IMPORT_TYPE })
        await createTestAcquiringIntegrationAccessRight(this.clients.admin, acquiringIntegration, this.clients.service.user)
        await createTestAcquiringIntegrationAccessRight(this.clients.admin, externalImportIntegration, this.clients.service.user)
        this.acquiringIntegration = acquiringIntegration
        this.externalImportIntegration = externalImportIntegration
        const [acquiringContext] = await createTestAcquiringIntegrationContext(this.clients.admin, this.organization, acquiringIntegration, { status: CONTEXT_FINISHED_STATUS })
        const [externalImportContext] = await createTestAcquiringIntegrationContext(this.clients.admin, this.organization, this.externalImportIntegration, { status: CONTEXT_FINISHED_STATUS })
        this.acquiringContext = acquiringContext
        this.externalImportAcquiringContext = externalImportContext
    },

    async updateAcquiringContext (updateInput) {
        return updateTestAcquiringIntegrationContext(this.clients.admin, this.acquiringContext.id, updateInput)
    },

    async updateAcquiringIntegration (updateInput) {
        return updateTestAcquiringIntegration(this.clients.admin, this.acquiringIntegration.id, updateInput)
    },

    generateExternalPayment (extraAttrs) {
        return {
            accountNumber: faker.finance.account(),
            tin: this.organization.tin,
            bankAccount: faker.finance.account(),
            routingNumber: '044525225',
            address: faker.address.streetAddress(true),
            period: dayjs().add(-1, 'month').format('YYYY-MM-01'),
            transactionDate: new Date().toISOString(),
            transactionId: faker.datatype.uuid(),
            amount: '100.00',
            paymentOrder: faker.random.numeric(5),
            currencyCode: 'RUB',
            ...extraAttrs,
        }
    },

    async registerExternalPayment (paymentExtraAttrs = {}) {
        const payload = {
            acquiringIntegrationContext: { id: this.externalImportAcquiringContext.id },
            payments: [this.generateExternalPayment(paymentExtraAttrs)],
        }
        return registerExternalPaymentsByTestClient(this.clients.service, payload)
    },

    async payForReceipt (receiptId, consumerId, amount) {
        const groupedReceipts = [{
            serviceConsumer: { id: consumerId },
            receipts: [{ id: receiptId }],
        }]
        if (amount) {
            groupedReceipts[0].amountDistribution = [{
                receipt: { id: receiptId },
                amount: amount,
            }]
        }

        const [ { multiPaymentId } ] = await registerMultiPaymentByTestClient(this.clients.resident, groupedReceipts)
        await this.completeMultiPayment(multiPaymentId)
    },

    async partialPayForVirtualReceipt (jsonReceipt, amount) {
        const partialReceipt = {
            currencyCode: this.billingIntegration.currencyCode || DEFAULT_CURRENCY_CODE,
            amount: amount,
            period: `${jsonReceipt.year}-${String(jsonReceipt.month).padStart(2, '0')}-01`,
            recipient: {
                routingNumber: jsonReceipt.routingNumber,
                bankAccount: jsonReceipt.bankAccount,
                accountNumber: jsonReceipt.accountNumber,
            },
        }

        const [{ multiPaymentId }] = await registerMultiPaymentForVirtualReceiptByTestClient(this.clients.admin, partialReceipt, { id: this.acquiringContext.id })
        await this.completeMultiPayment(multiPaymentId)
        return { multiPaymentId }
    },

    async completeMultiPayment (multiPaymentId) {
        const multiPayment = await MultiPayment.getOne(this.clients.service, { id: multiPaymentId })
        await updateTestPayment(this.clients.admin, multiPayment.payments[0].id, {
            explicitFee: '0.0',
            advancedAt: dayjs().toISOString(),
            transferDate: dayjs().toISOString(),
            status: PAYMENT_DONE_STATUS,
        })
        await updateTestMultiPayment(this.clients.admin, multiPayment.id, {
            explicitFee: '0.0',
            explicitServiceCharge: '0.0',
            withdrawnAt: dayjs().toISOString(),
            cardNumber: '407*****01',
            paymentWay: 'CARD',
            transactionId: faker.datatype.uuid(),
            status: MULTIPAYMENT_DONE_STATUS,
        })
    },

}

module.exports = {
    AcquiringTestMixin,
}