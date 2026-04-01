const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { SUBSCRIPTION_CONTEXT_STATUS } = require('@condo/domains/subscription/constants')
const { activateSubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')

const logger = getLogger('activateSubscriptionForInvoice')

async function activateSubscriptionForInvoice (invoiceId) {
    const { keystone: context } = getSchemaCtx('SubscriptionContext')

    logger.info({ 
        msg: 'searching for subscription context',
        entity: 'Invoice',
        entityId: invoiceId,
    })

    const [subscriptionContext] = await find('SubscriptionContext', {
        invoice: { id: invoiceId },
        status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
        deletedAt: null,
    })

    if (!subscriptionContext) {
        logger.warn({ 
            msg: 'SubscriptionContext not found for paid B2B invoice', 
            entity: 'Invoice',
            entityId: invoiceId,
        })
        return
    }

    logger.info({ 
        msg: 'activating subscription context', 
        entity: 'Invoice',
        entityId: invoiceId,
        subscriptionContextId: subscriptionContext.id,
    })

    try {
        await activateSubscriptionContext(context, {
            sender: { dv: 1, fingerprint: 'activateSubscriptionForInvoice' },
            subscriptionContext: { id: subscriptionContext.id },
        })
        logger.info({ 
            msg: 'subscription context activated successfully', 
            entity: 'Invoice',
            entityId: invoiceId,
            subscriptionContextId: subscriptionContext.id,
        })
    } catch (error) {
        logger.error({ 
            msg: 'failed to activate subscription context', 
            entity: 'Invoice',
            entityId: invoiceId,
            subscriptionContextId: subscriptionContext.id,
            error,
        })
        throw error
    }
}

module.exports = {
    activateSubscriptionForInvoiceFn: activateSubscriptionForInvoice,
    activateSubscriptionForInvoice: createTask('activateSubscriptionForInvoice', activateSubscriptionForInvoice),
}
