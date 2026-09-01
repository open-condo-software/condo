const Big = require('big.js')
const dayjs = require('dayjs')

const { GQLError } = require('@open-condo/keystone/errors')

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
const { loadBillingCategory } = require('@condo/domains/acquiring/utils/serverSchema/registerMultiPayment/loaders')
const { getNewPaymentsSum } = require('@condo/domains/billing/utils/serverSchema')
const { DEFAULT_INVOICE_CURRENCY_CODE } = require('@condo/domains/marketplace/constants')

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

/**
 * Builds payment input objects for a multi-payment request grouped by receipts.
 *
 * Each receipt from `groupedReceipts` gets its own Payment record with address
 * information resolved from the corresponding resident of the owning serviceConsumer.
 *
 * @param {Object} params
 * @param {Array<Object>} params.groupedReceipts - Receipts grouped by serviceConsumer.
 *   Each element: { serviceConsumer: { id: string }, receipts: Array<{ id: string }>, amountDistribution?: Array<{ receipt: { id: string }, amount: string }> }
 * @param {Record<string, Object>} params.consumersByIds - Map of serviceConsumer objects by ID.
 * @param {Record<string, Object>} params.receiptsByIds - Map of receipt objects by ID.
 * @param {Record<string, Object>} params.acquiringContextsByConsumerId - Map of acquiringContext by consumer ID.
 * @param {string} params.billingIntegrationCurrencyCode - Currency code for payments.
 * @param {Record<string, string>} params.addressKeysMap - Map from receipt.id → addressKey.
 * @param {Record<string, string>} params.unitTypesMap - Map from receipt.id → unitType.
 * @param {Record<string, string>} params.unitNamesMap - Map from receipt.id → unitName.
 * @param {Object} params.sender - Sender field for dv/double-version validation.
 * @param {Object} params.context - Keystone context.
 * @returns {Promise<Array<Object>>} Array of payment input objects ready for `Payment.create()`.
 */
async function buildReceiptPaymentInputs ({
    groupedReceipts,
    consumersByIds,
    receiptsByIds,
    acquiringContextsByConsumerId,
    billingIntegrationCurrencyCode,
    addressKeysMap,
    unitTypesMap,
    unitNamesMap,
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

            const receiptAddressKey = addressKeysMap[receiptInfo.id] ?? null
            const receiptUnitType = unitTypesMap[receiptInfo.id] ?? null
            const receiptUnitName = unitNamesMap[receiptInfo.id] ?? null

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
                addressKey: receiptAddressKey,
                unitType: receiptUnitType,
                unitName: receiptUnitName,
                ...paymentCommissionFields,
            })
        }
    }

    return paymentCreateInputs
}

/**
 * Builds payment input objects for a multi-payment request grouped by invoices.
 *
 * Each invoice gets its own Payment record with address information taken directly
 * from the corresponding invoice input (invoicesWithAddress).
 *
 * @param {Object} params
 * @param {Array<Object>} params.foundInvoices - Invoice objects to create payments for.
 * @param {Array<Object>} params.invoicesWithAddress - Invoice input objects with address fields: [{ id, addressKey, unitType, unitName }].
 * @param {Object} params.acquiringContext - The acquiring context associated with these invoices.
 * @param {Object} params.acquiringIntegration - The acquiring integration configuration (fee schemas, supported billing integrations, hostUrl).
 * @param {Object} params.sender - Sender field for dv/double-version validation.
 * @param {Object} params.context - Keystone context.
 * @returns {Promise<Array<Object>>} Array of payment input objects ready for `Payment.create()`.
 */
async function buildInvoicePaymentInputs ({
    foundInvoices,
    invoicesWithAddress,
    acquiringContext,
    acquiringIntegration,
    sender,
    context,
}) {
    const paymentCreateInputs = []

    // Build a map from invoice id → address fields for quick lookup
    const addressMap = Object.fromEntries(
        invoicesWithAddress.map(inv => [inv.id, {
            addressKey: inv.addressKey ?? null,
            unitType: inv.unitType ?? null,
            unitName: inv.unitName ?? null,
        }]),
    )

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

        const { addressKey: invoiceAddressKey, unitType: invoiceUnitType, unitName: invoiceUnitName } = addressMap[invoice.id] ?? {}

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
            addressKey: invoiceAddressKey,
            unitType: invoiceUnitType,
            unitName: invoiceUnitName,
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
        getCardTokensUrl: userId ? `${hostUrl}${GET_CARD_TOKENS_PATH.replace('[id]', userId)}` : '',
    }
}

module.exports = {
    buildInvoicePaymentInputs,
    buildReceiptPaymentInputs,
    buildOutputUrls,
}
