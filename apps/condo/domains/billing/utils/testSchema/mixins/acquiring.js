const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
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
} = require('@condo/domains/acquiring/utils/testSchema')
const { DEFAULT_CURRENCY_CODE } = require('@condo/domains/common/constants/currencies')

const { OrganizationTestMixin } = require('./organization')

const AcquiringTestMixin = {

    dependsOn: [OrganizationTestMixin],

    async initMixin () {
        const [acquiringIntegration] = await createTestAcquiringIntegration(this.clients.admin)
        await createTestAcquiringIntegrationAccessRight(this.clients.admin, acquiringIntegration, this.clients.service.user)
        this.acquiringIntegration = acquiringIntegration
        const [acquiringContext] = await createTestAcquiringIntegrationContext(this.clients.admin, this.organization, acquiringIntegration, { status: CONTEXT_FINISHED_STATUS })
        this.acquiringContext = acquiringContext
    },

    async updateAcquiringContext (updateInput) {
        return await updateTestAcquiringIntegrationContext(this.clients.admin, this.acquiringContext.id, updateInput)
    },

    async updateAcquiringIntegration (updateInput) {
        return await updateTestAcquiringIntegration(this.clients.admin, this.acquiringIntegration.id, updateInput)
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