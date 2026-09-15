const uniq = require('lodash/uniq')

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
    const planIds = uniq(subscriptionContexts.map(subscriptionContext => subscriptionContext.subscriptionPlan))
    const ruleIds = uniq(subscriptionContexts.map(subscriptionContext => subscriptionContext.subscriptionPlanPricingRule).filter(Boolean))

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

async function queueSubscriptionWebhook ({ url, secret, eventType, invoiceId, subscriptionContexts, getUser, getExtraPayload = () => ({}), sender }) {
    if (!url || !secret || subscriptionContexts.length === 0) return

    try {
        const invoice = await getById('Invoice', invoiceId)
        if (!invoice) return

        const organization = invoice.payerOrganization ? await getById('Organization', invoice.payerOrganization) : null
        if (!organization) {
            throw new Error(`Organization not found: ${invoice.payerOrganization}`)
        }
        const user = await getUser(invoice)

        const { keystone: context } = getSchemaCtx('WebhookPayload')
        await queueWebhookPayload(context, {
            url,
            secret,
            eventType,
            modelName: 'SubscriptionContext',
            itemId: subscriptionContexts[0].id,
            payload: {
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
            },
            sender,
        })
    } catch (err) {
        logger.error({ msg: 'failed to queue subscription webhook', err, entity: 'Invoice', entityId: invoiceId, data: { eventType } })
    }
}

/** Sent once a paid invoice has activated its contexts */
async function queueSubscriptionActivatedWebhook ({ invoiceId, subscriptionContexts, sender }) {
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
}

/** Sent when a bundle is registered to be paid by invoice, so a manager can send the invoice and reach the client */
async function queueSubscriptionInvoiceRequestedWebhook ({ invoiceId, subscriptionContexts, userId, sender }) {
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
        sender,
    })
}

module.exports = {
    queueSubscriptionActivatedWebhook,
    queueSubscriptionInvoiceRequestedWebhook,
}
