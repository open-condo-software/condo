const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { find, getById, getSchemaCtx } = require('@open-condo/keystone/schema')
const { queueWebhookPayload } = require('@open-condo/webhooks/utils/queueWebhookPayload')

const {
    WEBHOOK_EVENT_SUBSCRIPTION_ACTIVATED,
    WEBHOOK_EVENT_SUBSCRIPTION_INVOICE_REQUESTED,
} = require('@condo/domains/common/constants/webhooks')

const logger = getLogger('subscriptionWebhooks')

/** Plan and period of every context; rules and plans are read even when deleted, the contexts still point at them */
async function buildSubscriptionContextsPayload (subscriptionContexts) {
    const planIds = [...new Set(subscriptionContexts.map(subscriptionContext => subscriptionContext.subscriptionPlan))]
    const ruleIds = [...new Set(subscriptionContexts.map(subscriptionContext => subscriptionContext.subscriptionPlanPricingRule).filter(Boolean))]

    const plans = await find('SubscriptionPlan', { id_in: planIds })
    const rules = ruleIds.length > 0 ? await find('SubscriptionPlanPricingRule', { id_in: ruleIds }) : []

    return subscriptionContexts.map(subscriptionContext => {
        const plan = plans.find(({ id }) => id === subscriptionContext.subscriptionPlan)
        const rule = rules.find(({ id }) => id === subscriptionContext.subscriptionPlanPricingRule)

        return {
            id: subscriptionContext.id,
            planName: plan?.name ?? null,
            planType: plan?.planType ?? null,
            period: rule?.period ?? null,
            price: rule?.price ?? null,
            startAt: subscriptionContext.startAt,
            endAt: subscriptionContext.endAt,
        }
    })
}

/**
 * Throws when no WebhookPayload could be created. Once it exists, a failure to schedule the immediate send is only
 * logged: retryFailedWebhookPayloads picks pending payloads up.
 */
async function queueSubscriptionWebhook ({ url, secret, eventType, invoiceId, subscriptionContexts, getUser, getExtraPayload = () => ({}), sender }) {
    if (!url || !secret || subscriptionContexts.length === 0) return

    const invoice = await getById('Invoice', invoiceId)
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`)

    const organization = invoice.payerOrganization ? await getById('Organization', invoice.payerOrganization) : null
    if (!organization) throw new Error(`Organization not found: ${invoice.payerOrganization}`)

    const user = await getUser(invoice)
    const itemId = subscriptionContexts[0].id
    const payload = {
        invoiceId: invoice.id,
        toPay: invoice.toPay,
        currencyCode: invoice.currencyCode,
        ...getExtraPayload(invoice),
        subscriptionContexts: await buildSubscriptionContextsPayload(subscriptionContexts),
        organization: {
            id: organization.id,
            name: organization.name,
            tin: organization.tin,
        },
        ...(user && { user }),
    }

    const { keystone: context } = getSchemaCtx('WebhookPayload')
    const queuedAt = new Date().toISOString()
    try {
        await queueWebhookPayload(context, { url, secret, eventType, modelName: 'SubscriptionContext', itemId, payload, sender })
    } catch (err) {
        // only a payload of this very call proves the record was written: an earlier one must not hide a failed create
        const [createdPayload] = await find('WebhookPayload', { eventType, itemId, createdAt_gte: queuedAt, deletedAt: null })
        if (!createdPayload) throw err
        logger.error({ msg: 'failed to schedule subscription webhook, it stays pending for the retry task', err, entity: 'WebhookPayload', entityId: createdPayload.id, data: { eventType } })
    }
}

/** Sent once a paid invoice has activated its contexts; the activation is already done, so a failure is only logged */
async function queueSubscriptionActivatedWebhook ({ invoiceId, subscriptionContexts, sender }) {
    try {
        await queueSubscriptionWebhook({
            url: conf['SUBSCRIPTION_ACTIVATED_WEBHOOK_URL'],
            secret: conf['SUBSCRIPTION_ACTIVATED_WEBHOOK_SECRET'],
            eventType: WEBHOOK_EVENT_SUBSCRIPTION_ACTIVATED,
            invoiceId,
            subscriptionContexts,
            getUser: async (invoice) => {
                const user = invoice.createdBy ? await getById('User', invoice.createdBy) : null
                return user ? { id: user.id, name: user.name } : null
            },
            getExtraPayload: (invoice) => ({ paidAt: invoice.paidAt }),
            sender,
        })
    } catch (err) {
        logger.error({ msg: 'failed to queue subscription activated webhook', err, entity: 'Invoice', entityId: invoiceId })
    }
}

/**
 * Sent when a bundle is registered to be paid by invoice, so a manager can send the invoice and reach the client.
 * `isRepeated` marks a client asking again for an invoice issued before: nothing new is registered, the same invoice
 * has to be sent once more. Throws when the request could not be recorded, the registration rolls back then
 */
async function queueSubscriptionInvoiceRequestedWebhook ({ invoiceId, subscriptionContexts, userId, isRepeated = false, sender }) {
    await queueSubscriptionWebhook({
        url: conf['SUBSCRIPTION_INVOICE_REQUESTED_WEBHOOK_URL'],
        secret: conf['SUBSCRIPTION_INVOICE_REQUESTED_WEBHOOK_SECRET'],
        eventType: WEBHOOK_EVENT_SUBSCRIPTION_INVOICE_REQUESTED,
        invoiceId,
        subscriptionContexts,
        getUser: async () => {
            const user = userId ? await getById('User', userId) : null
            return user ? { id: user.id, name: user.name, phone: user.phone, email: user.email } : null
        },
        getExtraPayload: () => ({ isRepeated }),
        sender,
    })
}

module.exports = {
    queueSubscriptionActivatedWebhook,
    queueSubscriptionInvoiceRequestedWebhook,
}
