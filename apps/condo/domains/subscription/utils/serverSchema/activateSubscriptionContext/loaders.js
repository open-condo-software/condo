const { GQLError } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const { INVOICE_STATUS_PAID } = require('@condo/domains/marketplace/constants')
const { SUBSCRIPTION_CONTEXT_STATUS } = require('@condo/domains/subscription/constants')
const { ACTIVATE_SUBSCRIPTION_CONTEXT_ERRORS: ERRORS } = require('@condo/domains/subscription/constants/activateSubscriptionContextErrors')

const logger = getLogger('ActivateSubscriptionContextService')

const ACTIVATABLE_STATUSES = [
    SUBSCRIPTION_CONTEXT_STATUS.CREATED,
    SUBSCRIPTION_CONTEXT_STATUS.PENDING,
    SUBSCRIPTION_CONTEXT_STATUS.ERROR,
]

/**
 * Loads a non-deleted SubscriptionContext that is in an activatable status
 * (CREATED / PENDING / ERROR). Throws SUBSCRIPTION_CONTEXT_NOT_FOUND or
 * SUBSCRIPTION_CONTEXT_INVALID_STATUS.
 */
async function loadActivatableSubscriptionContextOrThrow (context, subscriptionContextId) {
    const [subscriptionContext] = await find('SubscriptionContext', {
        id: subscriptionContextId,
        deletedAt: null,
    })
    if (!subscriptionContext) {
        logger.warn({ msg: 'SubscriptionContext not found', data: { subscriptionContextId } })
        throw new GQLError(ERRORS.SUBSCRIPTION_CONTEXT_NOT_FOUND, context)
    }
    logger.info({ msg: 'Found subscription context', data: { subscriptionContextId: subscriptionContext.id, status: subscriptionContext.status, invoiceId: subscriptionContext.invoice } })

    if (!ACTIVATABLE_STATUSES.includes(subscriptionContext.status)) {
        logger.warn({ msg: 'SubscriptionContext has invalid status', data: { subscriptionContextId: subscriptionContext.id, status: subscriptionContext.status } })
        throw new GQLError(ERRORS.SUBSCRIPTION_CONTEXT_INVALID_STATUS, context)
    }

    return subscriptionContext
}

/**
 * Loads the paid Invoice a SubscriptionContext is attached to. Throws
 * INVOICE_NOT_FOUND when the context has no invoice or it is missing, and
 * INVOICE_NOT_PAID when the invoice is not in the PAID status.
 */
async function loadPaidInvoiceOrThrow (context, subscriptionContext) {
    if (!subscriptionContext.invoice) {
        logger.warn({ msg: 'SubscriptionContext has no invoice', data: { subscriptionContextId: subscriptionContext.id } })
        throw new GQLError(ERRORS.INVOICE_NOT_FOUND, context)
    }
    const [invoice] = await find('Invoice', {
        id: subscriptionContext.invoice,
        deletedAt: null,
    })
    if (!invoice) {
        logger.warn({ msg: 'Invoice not found', data: { invoiceId: subscriptionContext.invoice } })
        throw new GQLError(ERRORS.INVOICE_NOT_FOUND, context)
    }
    logger.info({ msg: 'Found invoice', data: { invoiceId: invoice.id, status: invoice.status } })

    if (invoice.status !== INVOICE_STATUS_PAID) {
        logger.warn({ msg: 'Invoice is not paid', data: { invoiceId: invoice.id, status: invoice.status } })
        throw new GQLError(ERRORS.INVOICE_NOT_PAID, context)
    }

    return invoice
}

module.exports = {
    loadActivatableSubscriptionContextOrThrow,
    loadPaidInvoiceOrThrow,
}
