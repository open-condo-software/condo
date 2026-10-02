const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { find, getById, getSchemaCtx } = require('@open-condo/keystone/schema')
const { queueWebhookPayload } = require('@open-condo/webhooks/utils/queueWebhookPayload')

const {
    WEBHOOK_EVENT_SUBSCRIPTION_ACTIVATED,
    WEBHOOK_EVENT_SUBSCRIPTION_INVOICE_REQUESTED,
} = require('@condo/domains/common/constants/webhooks')
const { SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_WEBHOOK_REASON } = require('@condo/domains/subscription/constants')

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
 * A card renewal or an auto-issued invoice is the cron acting, not a person - it has no user of its own, so
 * webhooks about it fall back to whoever registered this plan for real. That means the most recent completed
 * (DONE) registration, and specifically one made by the client, not by Doma's own support or admin staff
 * filling it in on the client's behalf - support registering a plan is not who a webhook should name as "the user"
 */
async function findOriginalRegistrationUserId (organizationId, planId) {
    if (!organizationId || !planId) return null

    const contexts = await find('SubscriptionContext', {
        organization: { id: organizationId },
        subscriptionPlan: { id: planId },
        status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
        deletedAt: null,
    })
    const creatorIds = [...new Set(contexts.map(context => context.createdBy).filter(Boolean))]
    if (creatorIds.length === 0) return null

    const users = await find('User', { id_in: creatorIds, deletedAt: null })
    const realUserIds = new Set(users.filter(user => !user.isSupport && !user.isAdmin).map(user => user.id))

    const sorted = [...contexts].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    const mostRecent = sorted.find(context => realUserIds.has(context.createdBy))
    return mostRecent?.createdBy || null
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
        eventType,
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

/**
 * Sent once a paid invoice has activated its contexts; the activation is already done, so a failure is only logged.
 * Only the renewal cron creates an invoice without a user, so such an invoice is a renewal
 */
async function queueSubscriptionActivatedWebhook ({ invoiceId, subscriptionContexts, sender }) {
    try {
        await queueSubscriptionWebhook({
            // subscription webhooks all go to the same endpoint - eventType in the payload tells them apart
            url: conf['SUBSCRIPTION_WEBHOOK_URL'],
            secret: conf['SUBSCRIPTION_WEBHOOK_SECRET'],
            eventType: WEBHOOK_EVENT_SUBSCRIPTION_ACTIVATED,
            invoiceId,
            subscriptionContexts,
            getUser: async (invoice) => {
                const userId = invoice.createdBy || await findOriginalRegistrationUserId(subscriptionContexts[0]?.organization, subscriptionContexts[0]?.subscriptionPlan)
                const user = userId ? await getById('User', userId) : null
                return user ? { id: user.id, name: user.name } : null
            },
            getExtraPayload: (invoice) => ({
                paidAt: invoice.paidAt,
                paymentType: subscriptionContexts[0]?.frozenPaymentInfo?.paymentType ?? null,
                reason: invoice.createdBy ? SUBSCRIPTION_WEBHOOK_REASON.PURCHASE : SUBSCRIPTION_WEBHOOK_REASON.RENEWAL,
            }),
            sender,
        })
    } catch (err) {
        logger.error({ msg: 'failed to queue subscription activated webhook', err, entity: 'Invoice', entityId: invoiceId })
    }
}

/**
 * Sent when a bundle is registered to be paid by invoice, so a manager can send the invoice and reach the client.
 * `reason` tells a client's purchase from an automatic renewal, and both from a client asking again for an invoice
 * issued before (resend: nothing new is registered, the same invoice has to be sent once more).
 * Throws when the request could not be recorded, the registration rolls back then
 */
async function queueSubscriptionInvoiceRequestedWebhook ({ invoiceId, subscriptionContexts, userId, reason = SUBSCRIPTION_WEBHOOK_REASON.PURCHASE, sender }) {
    await queueSubscriptionWebhook({
        // subscription webhooks all go to the same endpoint - eventType in the payload tells them apart
        url: conf['SUBSCRIPTION_WEBHOOK_URL'],
        secret: conf['SUBSCRIPTION_WEBHOOK_SECRET'],
        eventType: WEBHOOK_EVENT_SUBSCRIPTION_INVOICE_REQUESTED,
        invoiceId,
        subscriptionContexts,
        getUser: async () => {
            const resolvedUserId = userId || await findOriginalRegistrationUserId(subscriptionContexts[0]?.organization, subscriptionContexts[0]?.subscriptionPlan)
            const user = resolvedUserId ? await getById('User', resolvedUserId) : null
            return user ? { id: user.id, name: user.name, phone: user.phone, email: user.email } : null
        },
        getExtraPayload: () => ({ reason }),
        sender,
    })
}

module.exports = {
    queueSubscriptionActivatedWebhook,
    queueSubscriptionInvoiceRequestedWebhook,
}
