const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, find, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { queueWebhookPayload } = require('@open-condo/webhooks/utils/queueWebhookPayload')

const { WEBHOOK_EVENT_SUBSCRIPTION_ACTIVATED } = require('@condo/domains/common/constants/webhooks')
const { SUBSCRIPTION_CONTEXT_STATUS } = require('@condo/domains/subscription/constants')
const { activateSubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')

const logger = getLogger('activateSubscriptionForInvoice')

const SENDER = { dv: 1, fingerprint: 'activateSubscriptionForInvoice' }

async function queueSubscriptionActivatedWebhook (invoiceId, activatedContextIds) {
    const webhookUrl = conf['SUBSCRIPTION_ACTIVATED_WEBHOOK_URL']
    const webhookSecret = conf['SUBSCRIPTION_ACTIVATED_WEBHOOK_SECRET']
    if (!webhookUrl || !webhookSecret || activatedContextIds.length === 0) return

    try {
        const invoice = await getById('Invoice', invoiceId)
        if (!invoice) return

        const { keystone: internalContext } = getSchemaCtx('WebhookPayload')
        const payerOrg = invoice.payerOrganization ? await getById('Organization', invoice.payerOrganization) : null
        if (!payerOrg) {
            throw new Error(`Organization not found: ${invoice.payerOrganization}`)
        }
        const createdByUser = invoice.createdBy ? await getById('User', invoice.createdBy) : null
        const rows = Array.isArray(invoice.rows) ? invoice.rows : []

        await queueWebhookPayload(internalContext, {
            url: webhookUrl,
            secret: webhookSecret,
            eventType: WEBHOOK_EVENT_SUBSCRIPTION_ACTIVATED,
            modelName: 'SubscriptionContext',
            itemId: activatedContextIds[0],
            payload: {
                invoiceId: invoice.id,
                paidAt: invoice.paidAt,
                toPay: invoice.toPay,
                planName: rows[0]?.name,
                planNames: rows.map(row => row.name),
                subscriptionContextIds: activatedContextIds,
                organization: {
                    id: payerOrg.id,
                    name: payerOrg.name,
                    tin: payerOrg.tin,
                },
                ...(createdByUser && {
                    user: {
                        id: createdByUser.id,
                        name: createdByUser.name,
                    },
                }),
            },
            sender: SENDER,
        })
    } catch (err) {
        logger.error({ msg: 'failed to queue subscription webhook', err, entity: 'Invoice', entityId: invoiceId })
    }
}

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

    const activatedContextIds = []
    for (const subscriptionContext of subscriptionContexts) {
        try {
            await activateSubscriptionContext(context, {
                sender: SENDER,
                subscriptionContext: { id: subscriptionContext.id },
            })
            activatedContextIds.push(subscriptionContext.id)
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

    await queueSubscriptionActivatedWebhook(invoiceId, doneContexts.map(({ id }) => id))
}

module.exports = {
    activateSubscriptionForInvoiceFn: activateSubscriptionForInvoice,
    activateSubscriptionForInvoice: createTask('activateSubscriptionForInvoice', activateSubscriptionForInvoice),
}
