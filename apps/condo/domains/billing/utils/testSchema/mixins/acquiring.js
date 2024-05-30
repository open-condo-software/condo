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
} = require('@condo/domains/acquiring/utils/testSchema')
const { faker } = require('@faker-js/faker')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const dayjs = require('dayjs')
const {
    PAYMENT_DONE_STATUS,
    MULTIPAYMENT_DONE_STATUS,
} = require("@condo/domains/acquiring/constants/payment");

const AcquiringTestMixin = {

    async initMixin () {
        const [acquiringIntegration] = await createTestAcquiringIntegration(this.clients.admin)
        await createTestAcquiringIntegrationAccessRight(this.clients.admin, acquiringIntegration, this.clients.service.user)
        this.acquiringIntegration = acquiringIntegration
        const [acquiringContext] = await createTestAcquiringIntegrationContext(this.clients.admin, this.organization, acquiringIntegration, { status: CONTEXT_FINISHED_STATUS })
        this.acquiringContext = acquiringContext
    },

    async updateAcquiringContext (updateInput) {
        await updateTestAcquiringIntegrationContext(this.clients.admin, this.acquiringContext.id, updateInput)
    },

    async updateTestAcquiringIntegration (updateInput) {
        await updateTestAcquiringIntegration(this.clients.admin, this.acquiringIntegration.id, updateInput)
    },
    async completeMultiPayment(multiPaymentId) {
        const multiPayment = await MultiPayment.getOne(this.clients.service, { id: multiPaymentId })
        await updateTestPayment(this.clients.admin, multiPayment.payments[0].id, {
            explicitFee: '0.0',
            advancedAt: dayjs().toISOString(),
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
    async payForReceipt(receiptId, consumerId) {
        const [ { multiPaymentId } ] = await registerMultiPaymentByTestClient(this.clients.resident, {
            serviceConsumer: { id: consumerId },
            receipts: [{ id: receiptId }],
        })
        await this.completeMultiPayment(multiPaymentId)
    },
    async partialPayForReceipt(jsonReceipt, amount) {
        const partialReceipt = {
            currencyCode: this.billingIntegration.currencyCode,
            amount: amount,
            period: `${jsonReceipt.year}-${String(jsonReceipt.month).padStart(2, '0')}-01`,
            recipient: {
                routingNumber: jsonReceipt.routingNumber,
                bankAccount: jsonReceipt.bankAccount,
                accountNumber: jsonReceipt.accountNumber,
            },
        }
        const [ { multiPaymentId }] = await registerMultiPaymentForVirtualReceiptByTestClient(this.clients.admin, partialReceipt, { id: this.acquiringContext.id })
        await this.completeMultiPayment(multiPaymentId)
    },
}

module.exports = {
    AcquiringTestMixin,
}