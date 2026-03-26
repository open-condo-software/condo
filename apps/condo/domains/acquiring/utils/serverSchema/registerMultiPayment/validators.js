const Big = require('big.js')

const { GQLError } = require('@open-condo/keystone/errors')
const { find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { REGISTER_MULTI_PAYMENT_ERRORS: ERRORS } = require('@condo/domains/acquiring/constants/registerMultiPaymentErrors')
const { INVOICE_STATUS_PUBLISHED } = require('@condo/domains/marketplace/constants')

function assertGroupedReceiptsHaveReceipts (groupedReceipts, context) {
    if (groupedReceipts?.some(group => !group.receipts?.length)) {
        throw new GQLError(ERRORS.MISSING_REQUIRED_RECEIPTS_IN_GROUPED_RECEIPTS, context)
    }
}

function assertNoDuplicateServiceConsumers (groupedReceipts, context) {
    const consumersIds = groupedReceipts.map(group => group.serviceConsumer.id)
    const uniqueConsumerIds = new Set(consumersIds)
    if (consumersIds.length !== uniqueConsumerIds.size) {
        throw new GQLError(ERRORS.DUPLICATED_SERVICE_CONSUMER, context)
    }
}

function assertNoDuplicateReceipts (groupedReceipts, context) {
    const receiptsIds = groupedReceipts
        .flatMap(group => group.receipts)
        .map(receiptInfo => receiptInfo.id)
    const uniqueReceiptsIds = new Set(receiptsIds)
    if (receiptsIds.length !== uniqueReceiptsIds.size) {
        throw new GQLError(ERRORS.DUPLICATED_RECEIPT, context)
    }
}

function assertValidAmountDistribution (groupedReceipts, context) {
    const receiptsIds = groupedReceipts
        .flatMap(group => group.receipts)
        .map(receiptInfo => receiptInfo.id)

    const distributionReceipts = groupedReceipts
        .flatMap(group => group.amountDistribution)
        .filter(Boolean)

    if (distributionReceipts.length > 0) {
        const distributionReceiptsIds = distributionReceipts.map(receiptInfo => receiptInfo.receipt?.id)
        const distributionReceiptsAmounts = distributionReceipts
            .map(receiptInfo => receiptInfo.amount)
            .map(amount => Big(amount))
        const uniqueDistributionReceiptsIds = new Set(distributionReceiptsIds)

        if (distributionReceiptsIds.length !== receiptsIds.length) {
            throw new GQLError(ERRORS.BAD_AMOUNT_DISTRIBUTION_FOR_RECEIPTS, context)
        }
        if (distributionReceiptsIds.length !== uniqueDistributionReceiptsIds.size) {
            throw new GQLError(ERRORS.BAD_AMOUNT_DISTRIBUTION_FOR_RECEIPTS, context)
        }
        if (distributionReceiptsAmounts.some(amount => amount.lte(0)).length > 0) {
            throw new GQLError(ERRORS.BAD_AMOUNT_DISTRIBUTION_FOR_RECEIPTS, context)
        }
    }
}

function assertNoDuplicateInvoices (invoices, context) {
    if (invoices.length > 0 && invoices.length !== new Set(invoices.map(({ id }) => id)).size) {
        throw new GQLError(ERRORS.DUPLICATED_INVOICE, context)
    }
}

function assertEntitiesNotDeleted (entities, errorTemplate, context) {
    const deletedIds = entities.filter(entity => entity.deletedAt).map(entity => entity.id)
    if (deletedIds.length) {
        throw new GQLError({ ...errorTemplate, messageInterpolation: { ids: deletedIds.join(', ') } }, context)
    }
}

function assertSingleAcquiringIntegration (acquiringContexts, context) {
    const acquiringIntegrations = new Set(acquiringContexts.map(item => item.integration))
    if (acquiringIntegrations.size > 1) {
        throw new GQLError(ERRORS.MULTIPLE_ACQUIRING_INTEGRATION_CONTEXTS, context)
    }
}

function assertServiceConsumersBelongToCurrentUser (consumers, residentsById, authedUserId, context) {
    const foreignConsumers = consumers.filter(({ resident }) => {
        const residentRecord = residentsById[resident]
        return !residentRecord || residentRecord.user !== authedUserId
    })

    if (foreignConsumers.length > 0) {
        throw new GQLError(ERRORS.SERVICE_CONSUMERS_FOR_THIRD_USER, context)
    }
}

function assertAcquiringIntegrationIsActive (acquiringIntegration, context) {
    if (acquiringIntegration.deletedAt) {
        throw new GQLError({ ...ERRORS.ACQUIRING_INTEGRATION_IS_DELETED, messageInterpolation: { id: acquiringIntegration.id } }, context)
    }
}

function assertCanGroupReceiptsIfNeeded (receiptCount, acquiringIntegration, context) {
    if (receiptCount > 1 && !acquiringIntegration.canGroupReceipts) {
        throw new GQLError({ ...ERRORS.RECEIPTS_CANNOT_BE_GROUPED_BY_ACQUIRING_INTEGRATION, messageInterpolation: { id: acquiringIntegration.id } }, context)
    }
}

function assertBillingContextsNotDeleted (billingContexts, receipts, context) {
    const deletedBillingContextsIds = new Set(billingContexts.filter(item => item.deletedAt).map(item => item.id))
    if (deletedBillingContextsIds.size) {
        const failedReceipts = receipts
            .filter(receipt => deletedBillingContextsIds.has(receipt.context))
            .map(receipt => ({ receiptId: receipt.id, contextId: receipt.context }))
        throw new GQLError({ ...ERRORS.BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IS_DELETED, data: { failedReceipts } }, context)
    }
}

function assertBillingIntegrationsSupportedByAcquiring (billingIntegrations, supportedGroup, context) {
    const unsupportedBillings = billingIntegrations.filter(integration => integration.group !== supportedGroup)
    if (unsupportedBillings.length) {
        throw new GQLError({ ...ERRORS.ACQUIRING_INTEGRATION_DOES_NOT_SUPPORTS_BILLING_INTEGRATION, messageInterpolation: { unsupportedBillingIntegrations: unsupportedBillings.map(billing => billing.id).join(', ') } }, context)
    }
}

function assertBillingIntegrationsNotDeleted (billingIntegrations, receipts, billingContextsById, context) {
    const deletedBillingIntegrationsIds = new Set(billingIntegrations.filter(integration => integration.deletedAt).map(integration => integration.id))
    if (deletedBillingIntegrationsIds.size) {
        const failedReceipts = receipts
            .filter(receipt => deletedBillingIntegrationsIds.has(billingContextsById[receipt.context].integration))
            .map(receipt => ({ receiptId: receipt.id, integrationId: billingContextsById[receipt.context].integration }))
        throw new GQLError({ ...ERRORS.RECEIPT_HAS_DELETED_BILLING_INTEGRATION, data: { failedReceipts } }, context)
    }
}

function assertReceiptBelongsToServiceConsumer (groupedReceipts, consumersByIds, receiptsByIds, billingAccountsById, billingContextsByOrganizationId, context) {
    for (const group of groupedReceipts) {
        const consumer = consumersByIds[group.serviceConsumer.id]

        const organizationContexts = billingContextsByOrganizationId[consumer.organization] || []
        const allowedContextIds = new Set(organizationContexts.map(item => item.id))

        for (const receiptInfo of group.receipts) {
            const receipt = receiptsByIds[receiptInfo.id]
            const billingAccount = billingAccountsById[receipt.account]

            const isDifferentAccountNumber = billingAccount.number !== consumer.accountNumber
            const isContextNotAllowed = !allowedContextIds.has(billingAccount.context)

            if (isDifferentAccountNumber || isContextNotAllowed) {
                throw new GQLError({
                    ...ERRORS.RECEIPT_DOES_NOT_HAVE_COMMON_BILLING_ACCOUNT_WITH_SERVICE_CONSUMER,
                    messageInterpolation: {
                        receiptId: receiptInfo.id,
                        serviceConsumerId: group.serviceConsumer.id,
                    },
                }, context)
            }
        }
    }
}

function assertCurrencyConsistency (billingIntegrations, context) {
    const currencies = new Set(billingIntegrations.map(integration => integration.currencyCode))
    if (currencies.size > 1) {
        throw new GQLError(ERRORS.RECEIPTS_HAS_MULTIPLE_CURRENCIES, context)
    }
}

function assertReceiptsHavePositiveToPay (receipts, hasDistribution, context) {
    if (!hasDistribution) {
        const negativeReceiptsIds = receipts
            .filter(receipt => Big(receipt.toPay).lte(0))
            .map(receipt => receipt.id)
        if (negativeReceiptsIds.length) {
            throw new GQLError({
                ...ERRORS.RECEIPTS_HAVE_NEGATIVE_TO_PAY_VALUE,
                messageInterpolation: { ids: negativeReceiptsIds.join(', ') },
            }, context)
        }
    }
}

function assertInvoicesArePublished (foundInvoices, context) {
    if (foundInvoices.some(({ status }) => status !== INVOICE_STATUS_PUBLISHED)) {
        throw new GQLError(ERRORS.UNPUBLISHED_INVOICE, context)
    }
}

function assertInvoicesBelongToCurrentUser (foundInvoices, authedUserId, context) {
    if (foundInvoices.some(({ client }) => !!client && client !== authedUserId)) {
        throw new GQLError(ERRORS.INVOICES_FOR_THIRD_USER, context)
    }
}

function assertInvoiceAcquiringContextsFinished (acquiringContexts, context) {
    if (acquiringContexts.some(({ invoiceStatus }) => invoiceStatus !== CONTEXT_FINISHED_STATUS)) {
        throw new GQLError(ERRORS.INVOICE_CONTEXT_NOT_FINISHED, context)
    }
}

function assertNoRecurrentPaymentContextForInvoiceMode (recurrentPaymentContext, context) {
    if (recurrentPaymentContext) {
        throw new GQLError(ERRORS.RECURRENT_PAYMENT_CONTEXT_FORBIDDEN_FOR_INVOICES, context)
    }
}

function assertAllPaymentAmountsPositive (paymentCreateInputs, context) {
    const negativePayments = paymentCreateInputs.filter(payment => Big(payment.amount).lte(0))
    if (negativePayments.length > 0) {
        throw new GQLError(ERRORS.PAYMENT_AMOUNT_NOT_POSITIVE, context)
    }
}

function assertTotalAmountWithinAcquiringLimits (amountToPay, acquiringIntegration, context) {
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

async function validateRecurrentPaymentContext (recurrentPaymentContext, context) {
    if (!recurrentPaymentContext) return null

    const { id: recurrentPaymentContextId } = recurrentPaymentContext
    const recurrentContexts = await find('RecurrentPaymentContext', {
        id: recurrentPaymentContextId,
    })

    if (recurrentContexts.length === 0) {
        throw new GQLError({
            ...ERRORS.RECURRENT_PAYMENT_CONTEXT_IS_MISSING,
            messageInterpolation: { id: recurrentPaymentContextId },
        }, context)
    }

    const [recurrentContext] = recurrentContexts

    if (recurrentContext.deletedAt) {
        throw new GQLError({
            ...ERRORS.RECURRENT_PAYMENT_CONTEXT_IS_DELETED,
            messageInterpolation: { id: recurrentPaymentContextId },
        }, context)
    }

    return recurrentContext
}

module.exports = {
    assertAcquiringIntegrationIsActive,
    assertAllPaymentAmountsPositive,
    assertBillingContextsNotDeleted,
    assertBillingIntegrationsNotDeleted,
    assertBillingIntegrationsSupportedByAcquiring,
    assertCanGroupReceiptsIfNeeded,
    assertCurrencyConsistency,
    assertEntitiesNotDeleted,
    assertGroupedReceiptsHaveReceipts,
    assertInvoiceAcquiringContextsFinished,
    assertInvoicesArePublished,
    assertInvoicesBelongToCurrentUser,
    assertNoDuplicateInvoices,
    assertNoDuplicateReceipts,
    assertNoDuplicateServiceConsumers,
    assertNoRecurrentPaymentContextForInvoiceMode,
    assertReceiptBelongsToServiceConsumer,
    assertReceiptsHavePositiveToPay,
    assertSingleAcquiringIntegration,
    assertServiceConsumersBelongToCurrentUser,
    assertTotalAmountWithinAcquiringLimits,
    assertValidAmountDistribution,
    validateRecurrentPaymentContext,
}
