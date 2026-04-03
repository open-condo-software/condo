const Big = require('big.js')
const dayjs = require('dayjs')

const { GQLError } = require('@open-condo/keystone/errors')
const { find } = require('@open-condo/keystone/schema')

const {
    FEE_CALCULATION_PATH,
    WEB_VIEW_PATH,
    DIRECT_PAYMENT_PATH,
    GET_CARD_TOKENS_PATH,
} = require('@condo/domains/acquiring/constants/links')
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

async function loadBillingCategory (billingCategoryId) {
    if (!billingCategoryId) return null

    const [billingCategory] = await find('BillingCategory', {
        id: billingCategoryId,
    })

    return billingCategory
}

async function resolveReceiptAmount ({
    amountDistributionForReceipt,
    billingCategory,
    context,
    receipt,
    receiptInfo,
}) {
    if (amountDistributionForReceipt != null) {
        const amount = amountDistributionForReceipt.amount
        const isNotFullPayment = !Big(amount).eq(Big(receipt.toPay))

        if (billingCategory?.requiresFullPayment && isNotFullPayment) {
            throw new GQLError(ERRORS.FULL_PAYMENT_AMOUNT_MISMATCH, context)
        }

        return amount
    }

    const paidAmount = await getNewPaymentsSum(receiptInfo.id)
    return String(Big(receipt.toPay).minus(Big(paidAmount)))
}

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
            const amountDistributionForReceipt = amountDistributions.find(distribution => distribution.receipt.id === receipt.id)

            const frozenReceipt = await freezeBillingReceipt(context, receipt)
            const feeCalculator = new FeeDistribution(formula, billingCategoryId)
            const billingAccountNumber = frozenReceipt?.data?.account?.number

            const billingCategory = await loadBillingCategory(billingCategoryId)
            const amount = await resolveReceiptAmount({
                amountDistributionForReceipt,
                billingCategory,
                context,
                receipt,
                receiptInfo,
            })

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

function buildOutputUrls (hostUrl, multiPaymentId, userId) {
    return {
        webViewUrl: `${hostUrl}${WEB_VIEW_PATH.replace('[id]', multiPaymentId)}`,
        feeCalculationUrl: `${hostUrl}${FEE_CALCULATION_PATH.replace('[id]', multiPaymentId)}`,
        directPaymentUrl: `${hostUrl}${DIRECT_PAYMENT_PATH.replace('[id]', multiPaymentId)}`,
        getCardTokensUrl: `${hostUrl}${GET_CARD_TOKENS_PATH.replace('[id]', userId)}`,
    }
}

module.exports = {
    buildInvoicePaymentInputs,
    buildReceiptPaymentInputs,
    buildOutputUrls,
}
