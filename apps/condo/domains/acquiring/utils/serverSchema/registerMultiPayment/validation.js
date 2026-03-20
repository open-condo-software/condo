const Big = require('big.js')

const { GQLError } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')

const { ERRORS } = require('@condo/domains/acquiring/constants/registerMultiPayemnt')
const { INVOICE_STATUS_PUBLISHED } = require('@condo/domains/marketplace/constants')

function validateInput (data, context) {
    console.log('[DEBUG] validation.validateInput start', { data })
    const groupedReceipts = data?.groupedReceipts ?? []
    const invoices = data?.invoices ?? []

    checkDvAndSender(data, ERRORS.DV_VERSION_MISMATCH, ERRORS.WRONG_SENDER_FORMAT, context)

    if (!groupedReceipts.length && !invoices.length) {
        throw new GQLError(ERRORS.MISSING_REQUIRED_INPUT_DATA, context)
    }

    if (groupedReceipts.some(group => !group?.receipts?.length)) {
        throw new GQLError(ERRORS.MISSING_REQUIRED_RECEIPTS_IN_GROUPED_RECEIPTS, context)
    }

    const consumersIds = groupedReceipts.map(group => group.serviceConsumer.id)
    if (consumersIds.length !== new Set(consumersIds).size) {
        throw new GQLError(ERRORS.DUPLICATED_SERVICE_CONSUMER, context)
    }

    const receiptsIds = groupedReceipts.flatMap(group => group.receipts).map(r => r.id)
    if (receiptsIds.length !== new Set(receiptsIds).size) {
        throw new GQLError(ERRORS.DUPLICATED_RECEIPT, context)
    }

    // Check if any receipts were provided in groupedReceipts
    if (groupedReceipts.length > 0 && receiptsIds.length === 0) {
        throw new GQLError(ERRORS.MISSING_REQUIRED_RECEIPTS_IN_GROUPED_RECEIPTS, context)
    }

    const distributionReceipts = groupedReceipts
        .flatMap(group => group.amountDistribution)
        .filter(distribution => distribution !== null && distribution !== undefined)

    if (distributionReceipts.length > 0) {
        const distributionReceiptsIds = distributionReceipts.map(r => r?.receipt?.id)
        if (distributionReceiptsIds.length !== receiptsIds.length ||
            distributionReceiptsIds.length !== new Set(distributionReceiptsIds).size) {
            throw new GQLError(ERRORS.BAD_AMOUNT_DISTRIBUTION_FOR_RECEIPTS, context)
        }

        for (const distribution of distributionReceipts) {
            let amount
            try {
                amount = Big(distribution.amount)
            } catch (e) {
                throw new GQLError(ERRORS.BAD_AMOUNT_DISTRIBUTION_FOR_RECEIPTS, context)
            }

            if (amount.lte(0)) {
                throw new GQLError(ERRORS.BAD_AMOUNT_DISTRIBUTION_FOR_RECEIPTS, context)
            }
        }
    }

    if (invoices.length > 0) {
        const invoiceIds = invoices.map(i => i.id)
        if (invoiceIds.length !== new Set(invoiceIds).size) {
            throw new GQLError(ERRORS.DUPLICATED_INVOICE, context)
        }
    }
}

function validateInitialEntitiesState ({
    data,
    consumers,
    foundInvoices,
    recurrentContext,
}, context) {
    console.log('[DEBUG] validation.validateInitialEntitiesState start', {
        consumersCount: consumers.length,
        foundInvoicesCount: foundInvoices.length,
    })
    const groupedReceipts = data?.groupedReceipts ?? []
    const invoices = data?.invoices ?? []

    // Consumers validation
    const consumersIds = groupedReceipts.map(group => group.serviceConsumer.id)
    if (consumers.length !== consumersIds.length) {
        const existingIds = consumers.map(c => c.id)
        const missingIds = consumersIds.filter(id => !existingIds.includes(id))
        throw new GQLError({ ...ERRORS.MISSING_SERVICE_CONSUMERS, messageInterpolation: { ids: missingIds.join(', ') } }, context)
    }

    const deletedConsumersIds = consumers.filter(c => c.deletedAt).map(c => c.id)
    if (deletedConsumersIds.length) {
        throw new GQLError({ ...ERRORS.DELETED_CONSUMERS, messageInterpolation: { ids: deletedConsumersIds.join(', ') } }, context)
    }

    if (consumers.length > 0 && foundInvoices.length > 0) {
        throw new GQLError(ERRORS.RECEIPTS_WITH_INVOICES_FORBIDDEN, context)
    }

    // Invoices validation
    if (invoices.length > 0) {
        if (foundInvoices.length !== invoices.length) {
            const existingIds = new Set(foundInvoices.map(i => i.id))
            const missingIds = invoices.map(i => i.id).filter(id => !existingIds.has(id))
            throw new GQLError({ ...ERRORS.DELETED_INVOICES, messageInterpolation: { ids: missingIds.join(', ') } }, context)
        }

        const deletedInvoicesIds = foundInvoices.filter(i => !!i.deletedAt).map(i => i.id)
        if (deletedInvoicesIds.length > 0) {
            throw new GQLError({
                ...ERRORS.DELETED_INVOICES,
                messageInterpolation: { ids: deletedInvoicesIds.join(', ') },
            }, context)
        }

        if (foundInvoices.some(i => i.status !== INVOICE_STATUS_PUBLISHED)) {
            throw new GQLError(ERRORS.UNPUBLISHED_INVOICE, context)
        }
        if (foundInvoices.some(i => i.client && i.client !== context.authedItem.id)) {
            throw new GQLError(ERRORS.INVOICES_FOR_THIRD_USER, context)
        }
    }

    // Recurrent context validation
    if (data.recurrentPaymentContext) {
        const id = data.recurrentPaymentContext.id
        if (!recurrentContext) {
            throw new GQLError({ ...ERRORS.RECURRENT_PAYMENT_CONTEXT_IS_MISSING, messageInterpolation: { id } }, context)
        }
        if (recurrentContext.deletedAt) {
            throw new GQLError({ ...ERRORS.RECURRENT_PAYMENT_CONTEXT_IS_DELETED, messageInterpolation: { id } }, context)
        }
    }
}

function validateLimits (acquiringIntegration, amountToPay, context) {
    console.log('[DEBUG] validation.validateLimits start', {
        acquiringIntegrationId: acquiringIntegration?.id,
        amountToPay: amountToPay.toString(),
    })
    if (acquiringIntegration.minimumPaymentAmount && Big(amountToPay).lt(acquiringIntegration.minimumPaymentAmount)) {
        throw new GQLError({
            ...ERRORS.PAYMENT_AMOUNT_LESS_THAN_MINIMUM,
            messageInterpolation: { minimumPaymentAmount: Big(acquiringIntegration.minimumPaymentAmount).toString() },
        }, context)
    }

    if (acquiringIntegration.maximumPaymentAmount && Big(amountToPay).gt(acquiringIntegration.maximumPaymentAmount)) {
        throw new GQLError({
            ...ERRORS.PAYMENT_AMOUNT_GREATER_THAN_MAXIMUM,
            messageInterpolation: { maximumPaymentAmount: Big(acquiringIntegration.maximumPaymentAmount).toString() },
        }, context)
    }
}

module.exports = {
    validateInput,
    validateInitialEntitiesState,
    validateLimits,
}
