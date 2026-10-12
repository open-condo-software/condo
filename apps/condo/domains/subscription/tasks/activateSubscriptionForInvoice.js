const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { SUBSCRIPTION_CONTEXT_STATUS } = require('@condo/domains/subscription/constants')
const { activateSubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')
const { queueSubscriptionActivatedWebhook } = require('@condo/domains/subscription/utils/serverSchema/subscriptionWebhooks')

const logger = getLogger('activateSubscriptionForInvoice')

const SENDER = { dv: 1, fingerprint: 'activateSubscriptionForInvoice' }

async function activateSubscriptionForInvoice (invoiceId) {
    const { keystone: context } = getSchemaCtx('SubscriptionContext')

    const subscriptionContexts = await find('SubscriptionContext', {
        invoice: { id: invoiceId },
        status_in: [SUBSCRIPTION_CONTEXT_STATUS.CREATED, SUBSCRIPTION_CONTEXT_STATUS.PENDING],
        deletedAt: null,
    })

    if (subscriptionContexts.length === 0) {
        logger.warn({
            msg: 'no subscription contexts to activate for paid invoice',
            entity: 'Invoice',
            entityId: invoiceId,
        })
        return
    }

    for (const subscriptionContext of subscriptionContexts) {
        try {
            await activateSubscriptionContext(context, {
                sender: SENDER,
                subscriptionContext: { id: subscriptionContext.id },
            })
            logger.info({
                msg: 'subscription context activated',
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

    const doneContexts = await find('SubscriptionContext', {
        invoice: { id: invoiceId },
        status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
        deletedAt: null,
    })

    await queueSubscriptionActivatedWebhook({ invoiceId, subscriptionContexts: doneContexts, sender: SENDER })
}

module.exports = {
    activateSubscriptionForInvoiceFn: activateSubscriptionForInvoice,
    activateSubscriptionForInvoice: createTask('activateSubscriptionForInvoice', activateSubscriptionForInvoice),
}
