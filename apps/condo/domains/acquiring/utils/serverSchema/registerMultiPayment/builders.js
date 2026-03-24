const Big = require('big.js')
const dayjs = require('dayjs')

const { GQLError } = require('@open-condo/keystone/errors')
const { find } = require('@open-condo/keystone/schema')

const { REGISTER_MULTI_PAYMENT_ERRORS: ERRORS } = require('@condo/domains/acquiring/constants/registerMultiPaymentErrors')
const { freezeBillingReceipt, freezeInvoice } = require('@condo/domains/acquiring/utils/billingFridge')
const {
    getAcquiringIntegrationContextFormula,
    FeeDistribution,
    compactDistributionSettings,
} = require('@condo/domains/acquiring/utils/serverSchema/feeDistribution')
const { buildCommissionFields } = require('@condo/domains/acquiring/utils/serverSchema/registerMultiPayment/helpers')
const { getNewPaymentsSum } = require('@condo/domains/billing/utils/serverSchema')
const { DEFAULT_INVOICE_CURRENCY_CODE } = require('@condo/domains/marketplace/constants')

async function buildReceiptPaymentInputs ({
    groupedReceipts,
    consumersByIds,
    receiptsByIds,
    acquiringContextsByConsumerId,
    billingIntegrationCurrencyCode,
    sender,
    context,
}) {
    const paymentCreateInputs = []

    for (const group of groupedReceipts) {
        const serviceConsumer = consumersByIds[group.serviceConsumer.id]
        const acquiringContext = acquiringContextsByConsumerId[serviceConsumer.id]
        const amountDistributions = group.amountDistribution || []
        const formula = await getAcquiringIntegrationContextFormula(context, acquiringContext.id)

        for (const receiptInfo of group.receipts) {
            const receipt = receiptsByIds[receiptInfo.id]
            const billingCategoryId = receipt.category
            const toPayFromReceipt = receipt.toPay
            const amountDistributionForReceipt = amountDistributions.find(distribution => distribution.receipt.id === receipt.id)

            const frozenReceipt = await freezeBillingReceipt(context, receipt)
            const feeCalculator = new FeeDistribution(formula, billingCategoryId)
            const billingAccountNumber = frozenReceipt?.data?.account?.number

            let billingCategories
            if (billingCategoryId) {
                billingCategories = await find('BillingCategory', {
                    id: billingCategoryId,
                })
            }

            let amount = null
            if (amountDistributionForReceipt !== null && amountDistributionForReceipt !== undefined) {
                amount = amountDistributionForReceipt.amount
                const isNotFullPayment = !new Big(amount).eq(new Big(toPayFromReceipt))
                if (billingCategories && billingCategories[0]?.requiresFullPayment && isNotFullPayment) {
                    throw new GQLError(ERRORS.FULL_PAYMENT_AMOUNT_MISMATCH, context)
                }
            } else {
                const paidAmount = await getNewPaymentsSum(receiptInfo.id)
                amount = String(Big(receipt.toPay).minus(Big(paidAmount)))
            }

            const { type, explicitFee = '0', implicitFee = '0', fromReceiptAmountFee = '0' } = feeCalculator.calculate(amount)
            const paymentCommissionFields = buildCommissionFields({ type, explicitFee, implicitFee, fromReceiptAmountFee })

            paymentCreateInputs.push({
                dv: 1,
                sender,
                amount,
                currencyCode: billingIntegrationCurrencyCode,
                accountNumber: billingAccountNumber,
                period: receipt.period,
                receipt: { connect: { id: receiptInfo.id } },
                frozenReceipt,
                context: { connect: { id: acquiringContext.id } },
                organization: { connect: { id: acquiringContext.organization } },
                recipientBic: receipt.recipient.bic,
                recipientBankAccount: receipt.recipient.bankAccount,
                ...paymentCommissionFields,
            })
        }
    }

    return paymentCreateInputs
}

async function buildInvoicePaymentInputs ({
    foundInvoices,
    acquiringContext,
    acquiringIntegration,
    sender,
    context,
}) {
    const paymentCreateInputs = []

    for (const invoice of foundInvoices) {
        const frozenInvoice = await freezeInvoice(invoice)
        const feeCalculator = new FeeDistribution(compactDistributionSettings([
            ...acquiringIntegration.explicitFeeDistributionSchema,
            ...acquiringContext.invoiceImplicitFeeDistributionSchema,
        ]))
        const organizationId = frozenInvoice?.data?.organization?.id
        const routingNumber = acquiringContext?.invoiceRecipient?.bic
        const bankAccount = acquiringContext?.invoiceRecipient?.bankAccount
        const amount = String(Big(invoice.toPay))

        const { type, explicitFee = '0', implicitFee = '0', fromReceiptAmountFee = '0' } = feeCalculator.calculate(amount)
        const paymentCommissionFields = buildCommissionFields({ type, explicitFee, implicitFee, fromReceiptAmountFee })

        paymentCreateInputs.push({
            dv: 1,
            sender,
            amount,
            context: { connect: { id: acquiringContext.id } },
            currencyCode: DEFAULT_INVOICE_CURRENCY_CODE,
            invoice: { connect: { id: invoice.id } },
            frozenInvoice,
            period: dayjs().format('YYYY-MM-01'),
            organization: { connect: { id: organizationId } },
            recipientBic: routingNumber,
            recipientBankAccount: bankAccount,
            ...paymentCommissionFields,
        })
    }

    return paymentCreateInputs
}

module.exports = {
    buildInvoicePaymentInputs,
    buildReceiptPaymentInputs,
}
