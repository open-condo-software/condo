const Big = require('big.js')
const dayjs = require('dayjs')
const uniq = require('lodash/uniq')

const { GQLError } = require('@open-condo/keystone/errors')
const { getById, find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const {
    ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE,
} = require('@condo/domains/acquiring/constants/integration')
const { ERRORS } = require('@condo/domains/acquiring/constants/registerMultiPayemnt')
const { freezeBillingReceipt, freezeInvoice } = require('@condo/domains/acquiring/utils/billingFridge')
const { AcquiringIntegration } = require('@condo/domains/acquiring/utils/serverSchema')
const {
    getAcquiringIntegrationContextFormula,
    FeeDistribution,
    compactDistributionSettings,
} = require('@condo/domains/acquiring/utils/serverSchema/feeDistribution')
const { getNewPaymentsSum } = require('@condo/domains/billing/utils/serverSchema')
const { DEFAULT_INVOICE_CURRENCY_CODE } = require('@condo/domains/marketplace/constants')

function calculateCommission (feeCalculator, amount) {
    const { type, explicitFee = '0', implicitFee = '0', fromReceiptAmountFee = '0' } = feeCalculator.calculate(amount)
    return {
        ...type === 'service' ? {
            explicitServiceCharge: String(explicitFee),
            explicitFee: '0',
        } : {
            explicitServiceCharge: '0',
            explicitFee: String(explicitFee),
        },
        implicitFee: String(implicitFee),
        serviceFee: String(fromReceiptAmountFee),
    }
}

async function validateReceiptConsumerMatch (receipt, consumer, context) {
    const billingAccount = await getById('BillingAccount', receipt.account)
    const allBillingContexts = await find('BillingIntegrationOrganizationContext', { deletedAt: null, organization: { id: consumer.organization } })
    const contextIds = allBillingContexts.map(x => x.id)

    if (billingAccount.number !== consumer.accountNumber || !contextIds.includes(billingAccount.context)) {
        throw new GQLError({
            ...ERRORS.RECEIPT_DOES_NOT_HAVE_COMMON_BILLING_ACCOUNT_WITH_SERVICE_CONSUMER,
            messageInterpolation: { receiptId: receipt.id, serviceConsumerId: consumer.id },
        }, context)
    }
}

async function validateFullPaymentIfNeeded (amount, toPay, categoryId, context) {
    if (!categoryId) return
    const [category] = await find('BillingCategory', { id: categoryId })
    if (category?.requiresFullPayment && !Big(amount).eq(Big(toPay))) {
        throw new GQLError(ERRORS.FULL_PAYMENT_AMOUNT_MISMATCH, context)
    }
}




async function fetchRelatedEntitiesAndProcessReceipts ({ data, context, consumers }) {
    console.log('[DEBUG] processor.fetchRelatedEntitiesAndProcessReceipts start')
    const groupedReceipts = data?.groupedReceipts ?? []
    const consumersByIds = Object.fromEntries(consumers.map(c => [c.id, c]))

    // 1. Load Acquiring Contexts (by organization)
    const orgIds = uniq(consumers.map(c => c.organization))
    const acquiringContexts = await find('AcquiringIntegrationContext', {
        organization: { id_in: orgIds },
        integration: { type: ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE, deletedAt: null },
        deletedAt: null,
    }, 'id integration organization invoiceStatus invoiceImplicitFeeDistributionSchema invoiceRecipient { bic bankAccount } deletedAt')

    if (acquiringContexts.length === 0) {
        throw new GQLError(ERRORS.ACQUIRING_INTEGRATION_CONTEXT_IS_MISSING, context)
    }

    if (new Set(acquiringContexts.map(c => c.integration)).size > 1) {
        throw new GQLError(ERRORS.MULTIPLE_ACQUIRING_INTEGRATION_CONTEXTS, context)
    }

    const acqContextsByOrgIds = Object.fromEntries(acquiringContexts.map(c => [c.organization, c]))

    // 2. Load Acquiring Integration
    const integrationId = acquiringContexts[0].integration
    const [acquiringIntegration] = await AcquiringIntegration.getAll(context, { id: integrationId },
        'id type canGroupReceipts supportedBillingIntegrationsGroup explicitFeeDistributionSchema minimumPaymentAmount maximumPaymentAmount hostUrl deletedAt')

    if (!acquiringIntegration || acquiringIntegration.deletedAt) {
        throw new GQLError({ ...ERRORS.ACQUIRING_INTEGRATION_IS_DELETED, messageInterpolation: { id: integrationId } }, context)
    }

    if (acquiringIntegration.type !== ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE) {
        throw new GQLError(ERRORS.ACQUIRING_INTEGRATION_TYPE_MISMATCH, context)
    }

    // 3. Load Receipts
    const receiptsIds = groupedReceipts.flatMap(group => group.receipts).map(r => r.id)
    if (receiptsIds.length > 1 && !acquiringIntegration.canGroupReceipts) {
        throw new GQLError({ ...ERRORS.RECEIPTS_CANNOT_BE_GROUPED_BY_ACQUIRING_INTEGRATION, messageInterpolation: { id: acquiringIntegration.id } }, context)
    }

    const receipts = await find('BillingReceipt', { id_in: receiptsIds }, 'id context category toPay period account recipient { bic bankAccount } deletedAt')
    if (receipts.length !== receiptsIds.length) {
        const existingIds = new Set(receipts.map(r => r.id))
        const missingReceiptIds = receiptsIds.filter(id => !existingIds.has(id))
        throw new GQLError({
            ...ERRORS.CANNOT_FIND_ALL_RECEIPTS,
            messageInterpolation: { missingReceiptIds: missingReceiptIds.join(', ') },
        }, context)
    }

    const deletedReceiptsIds = receipts.filter(r => !!r.deletedAt).map(r => r.id)
    if (deletedReceiptsIds.length) {
        throw new GQLError({ ...ERRORS.RECEIPTS_ARE_DELETED, messageInterpolation: { ids: deletedReceiptsIds.join(', ') } }, context)
    }

    const distributionReceipts = groupedReceipts.flatMap(group => group.amountDistribution).filter(Boolean)
    if (distributionReceipts.length === 0) {
        const negativeReceiptsIds = receipts.filter(r => Big(r.toPay).lte(0)).map(r => r.id)
        if (negativeReceiptsIds.length) {
            throw new GQLError({ ...ERRORS.RECEIPTS_HAVE_NEGATIVE_TO_PAY_VALUE, messageInterpolation: { ids: negativeReceiptsIds.join(', ') } }, context)
        }
    }

    const receiptsByIds = Object.fromEntries(receipts.map(r => [r.id, r]))

    // 4. Load Billing Contexts and Integrations
    const billingContextIds = uniq(receipts.map(r => r.context))
    const billingContexts = await find('BillingIntegrationOrganizationContext', { id_in: billingContextIds }, 'id integration deletedAt')

    const deletedBillingContextsIds = new Set(billingContexts.filter(c => !!c.deletedAt).map(c => c.id))
    if (deletedBillingContextsIds.size) {
        const failedReceipts = receipts
            .filter(r => deletedBillingContextsIds.has(r.context))
            .map(r => ({ receiptId: r.id, contextId: r.context }))
        throw new GQLError({ ...ERRORS.BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IS_DELETED, data: { failedReceipts } }, context)
    }

    const billingIntegrationIds = uniq(billingContexts.map(c => c.integration))
    const billingIntegrations = await find('BillingIntegration', { id_in: billingIntegrationIds }, 'id group currencyCode deletedAt')

    const supportedGroup = acquiringIntegration.supportedBillingIntegrationsGroup
    const unsupportedBillings = billingIntegrations.filter(i => i.group !== supportedGroup)
    if (unsupportedBillings.length) {
        throw new GQLError({ ...ERRORS.ACQUIRING_INTEGRATION_DOES_NOT_SUPPORTS_BILLING_INTEGRATION, messageInterpolation: { unsupportedBillingIntegrations: unsupportedBillings.map(i => i.id).join(', ') } }, context)
    }

    const deletedBillingIntegrationsIds = new Set(billingIntegrations.filter(i => !!i.deletedAt).map(i => i.id))
    if (deletedBillingIntegrationsIds.size) {
        const billingContextsById = Object.fromEntries(billingContexts.map(c => [c.id, c]))
        const failedReceipts = receipts
            .filter(r => deletedBillingIntegrationsIds.has(billingContextsById[r.context].integration))
            .map(r => ({ receiptId: r.id, integrationId: billingContextsById[r.context].integration }))
        throw new GQLError({ ...ERRORS.RECEIPT_HAS_DELETED_BILLING_INTEGRATION, data: { failedReceipts } }, context)
    }

    if (new Set(billingIntegrations.map(i => i.currencyCode)).size > 1) {
        throw new GQLError(ERRORS.RECEIPTS_HAS_MULTIPLE_CURRENCIES, context)
    }

    const currencyCode = billingIntegrations?.[0]?.currencyCode

    // 5. Process Receipts
    const paymentCreateInputs = []
    for (const group of groupedReceipts) {
        const serviceConsumer = consumersByIds[group.serviceConsumer.id]
        const acquiringContext = acqContextsByOrgIds[serviceConsumer.organization]
        if (!acquiringContext) {
            throw new GQLError(ERRORS.ACQUIRING_INTEGRATION_CONTEXT_IS_MISSING, context)
        }
        const amountDistributions = group.amountDistribution || []
        const formula = await getAcquiringIntegrationContextFormula(context, acquiringContext.id)

        for (const receiptInfo of group.receipts) {
            const receipt = receiptsByIds[receiptInfo.id]
            await validateReceiptConsumerMatch(receipt, serviceConsumer, context)

            const frozenReceipt = await freezeBillingReceipt(context, receipt)
            const feeCalculator = new FeeDistribution(formula, receipt.category)
            const billingAccountNumber = frozenReceipt?.data?.account?.number

            let amount = null
            const distribution = amountDistributions.find(d => d.receipt.id === receipt.id)
            if (distribution) {
                amount = distribution.amount
                await validateFullPaymentIfNeeded(amount, receipt.toPay, receipt.category, context)
            } else {
                const paidAmount = await getNewPaymentsSum(receiptInfo.id)
                amount = Big(receipt.toPay).minus(Big(paidAmount)).toFixed(2)
            }

            const commissionFields = calculateCommission(feeCalculator, amount)

            paymentCreateInputs.push({
                dv: 1,
                sender: data.sender,
                amount,
                currencyCode,
                accountNumber: billingAccountNumber,
                period: receipt.period,
                receipt: { connect: { id: receiptInfo.id } },
                frozenReceipt,
                context: { connect: { id: acquiringContext.id } },
                organization: { connect: { id: acquiringContext.organization } },
                recipientBic: receipt.recipient.bic,
                recipientBankAccount: receipt.recipient.bankAccount,
                ...commissionFields,
            })
        }
    }

    return { paymentCreateInputs, acquiringIntegration, billingIntegrations }
}

async function fetchRelatedEntitiesAndProcessInvoices ({ data, context, foundInvoices }) {
    console.log('[DEBUG] processor.fetchRelatedEntitiesAndProcessInvoices start')

    // 1. Load Acquiring Contexts (by organization)
    const orgIds = uniq(foundInvoices.map(i => i.organization))

    const acquiringContexts = await find('AcquiringIntegrationContext', {
        organization: { id_in: orgIds },
        integration: { type: ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE, deletedAt: null },
        deletedAt: null,
    }, 'id integration organization invoiceStatus invoiceImplicitFeeDistributionSchema invoiceRecipient { bic bankAccount } deletedAt')

    if (acquiringContexts.length === 0) {
        throw new GQLError(ERRORS.ACQUIRING_INTEGRATION_CONTEXT_IS_MISSING, context)
    }

    if (new Set(acquiringContexts.map(c => c.integration)).size > 1) {
        throw new GQLError(ERRORS.MULTIPLE_ACQUIRING_INTEGRATION_CONTEXTS, context)
    }

    if (acquiringContexts.some(c => c.invoiceStatus !== CONTEXT_FINISHED_STATUS)) {
        throw new GQLError(ERRORS.INVOICE_CONTEXT_NOT_FINISHED, context)
    }

    const acqContext = acquiringContexts[0]

    // 2. Load Acquiring Integration
    const [acquiringIntegration] = await AcquiringIntegration.getAll(context, { id: acqContext.integration },
        'id type canGroupReceipts supportedBillingIntegrationsGroup explicitFeeDistributionSchema minimumPaymentAmount maximumPaymentAmount hostUrl deletedAt')

    if (!acquiringIntegration || acquiringIntegration.deletedAt) {
        throw new GQLError({ ...ERRORS.ACQUIRING_INTEGRATION_IS_DELETED, messageInterpolation: { id: acqContext.integration } }, context)
    }

    if (acquiringIntegration.type !== ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE) {
        throw new GQLError(ERRORS.ACQUIRING_INTEGRATION_TYPE_MISMATCH, context)
    }

    // 3. Process Invoices
    const paymentCreateInputs = []
    for (const invoice of foundInvoices) {
        const frozenInvoice = await freezeInvoice(invoice)

        const distributionSettings = compactDistributionSettings([
            ...acquiringIntegration?.explicitFeeDistributionSchema ?? [],
            ...acqContext?.invoiceImplicitFeeDistributionSchema ?? [],
        ])

        if (!distributionSettings.commission && !distributionSettings.service) {
            distributionSettings.commission = { percent: '0' }
        }
        if (!distributionSettings.acquiring) {
            distributionSettings.acquiring = { percent: '0' }
        }

        const feeCalculator = new FeeDistribution(distributionSettings)
        const amount = Big(invoice.toPay).toFixed(2)

        if (Big(amount).lte(0)) {
            throw new GQLError({
                ...ERRORS.PAYMENT_AMOUNT_LESS_THAN_MINIMUM,
                messageInterpolation: { minimumPaymentAmount: '0' },
            }, context)
        }

        const commissionFields = calculateCommission(feeCalculator, amount)

        paymentCreateInputs.push({
            dv: 1,
            sender: data.sender,
            amount,
            context: { connect: { id: acqContext.id } },
            currencyCode: DEFAULT_INVOICE_CURRENCY_CODE,
            invoice: { connect: { id: invoice.id } },
            frozenInvoice,
            period: dayjs().format('YYYY-MM-01'),
            organization: { connect: { id: frozenInvoice?.data?.organization?.id } },
            recipientBic: acqContext?.invoiceRecipient?.bic,
            recipientBankAccount: acqContext?.invoiceRecipient?.bankAccount,
            ...commissionFields,
        })
    }
    return { paymentCreateInputs, acquiringIntegration }
}

function calculateTotalAmount (paymentInputs) {
    return paymentInputs.reduce((acc, cur) => ({
        amountWithoutExplicitFee: acc.amountWithoutExplicitFee.add(Big(cur.amount)),
        explicitFee: acc.explicitFee.add(Big(cur.explicitFee)),
        explicitServiceCharge: acc.explicitServiceCharge.add(Big(cur.explicitServiceCharge)),
        serviceFee: acc.serviceFee.add(Big(cur.serviceFee)),
        implicitFee: acc.implicitFee.add(Big(cur.implicitFee)),
    }), {
        amountWithoutExplicitFee: Big('0.0'),
        explicitFee: Big('0.0'),
        explicitServiceCharge: Big('0.0'),
        serviceFee: Big('0.0'),
        implicitFee: Big('0.0'),
    })
}

module.exports = {
    fetchRelatedEntitiesAndProcessReceipts,
    fetchRelatedEntitiesAndProcessInvoices,
    calculateTotalAmount,
}
