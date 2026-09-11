const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById, itemsQuery } = require('@open-condo/keystone/schema')

const { registerMultiPayment } = require('@condo/domains/acquiring/utils/serverSchema')
const { INVOICE_STATUS_PAID } = require('@condo/domains/marketplace/constants')
const { SUBSCRIPTION_PAYMENT_BUFFER_DAYS, SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_PLAN_TYPE_SERVICE, SUBSCRIPTION_PAYMENT_TYPE_CARD } = require('@condo/domains/subscription/constants')
const { SubscriptionPaymentAdapter } = require('@condo/domains/subscription/tasks/utils/SubscriptionPaymentAdapter')
const { registerSubscriptionContexts, SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')
const { buildDirectPaymentUrl } = require('@condo/domains/subscription/utils/serverSchema/buildDirectPaymentUrl')

const logger = getLogger('processRecurrentSubscriptionPayments')

const SENDER = { dv: 1, fingerprint: 'processRecurrentSubscriptionPayments' }

async function findExistingRenewalBundle (organizationId, renewalRuleIds) {
    const wantedComposition = [...renewalRuleIds].sort().join(',')

    const contexts = await itemsQuery('SubscriptionContext', {
        where: {
            organization: { id: organizationId },
            status_in: [SUBSCRIPTION_CONTEXT_STATUS.CREATED, SUBSCRIPTION_CONTEXT_STATUS.PENDING],
            isTrial: false,
            deletedAt: null,
        },
    })

    const byInvoice = new Map()
    for (const subscriptionContext of contexts) {
        if (!subscriptionContext.invoice) continue
        if (!byInvoice.has(subscriptionContext.invoice)) byInvoice.set(subscriptionContext.invoice, [])
        byInvoice.get(subscriptionContext.invoice).push(subscriptionContext)
    }

    for (const [invoiceId, bundle] of byInvoice) {
        const composition = bundle.map(subscriptionContext => subscriptionContext.subscriptionPlanPricingRule).sort().join(',')
        if (composition === wantedComposition) {
            return { invoiceId, contextIds: bundle.map(subscriptionContext => subscriptionContext.id) }
        }
    }
    return null
}

async function processRecurrentSubscriptionPayments () {
    const { keystone } = getSchemaCtx('SubscriptionContext')
    const context = await keystone.createContext({ skipAccessControl: true })

    const today = dayjs().format('YYYY-MM-DD')
    const bufferDate = dayjs().subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS, 'days').format('YYYY-MM-DD')

    logger.info({ msg: 'searching for subscription contexts to renew', data: { today, bufferDate } })

    const contexts = await itemsQuery('SubscriptionContext', {
        where: {
            bindingId_not: null,
            status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
            endAt_gte: bufferDate,
            endAt_lte: today,
            deletedAt: null,
        },
        sortBy: ['endAt_DESC'],
    })

    const groups = new Map()
    for (const subscriptionContext of contexts) {
        const key = subscriptionContext.invoice || `no-invoice:${subscriptionContext.id}`
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(subscriptionContext)
    }

    logger.info({ msg: 'found subscription contexts to renew', count: contexts.length, groupCount: groups.size })

    for (const group of groups.values()) {
        const organizationId = group[0].organization
        const bindingId = group[0].bindingId
        const groupContextIds = group.map(subscriptionContext => subscriptionContext.id)

        try {
            const groupEndAt = group.reduce((min, subscriptionContext) => (!min || subscriptionContext.endAt < min ? subscriptionContext.endAt : min), null)

            const { count: renewedCount } = await itemsQuery('SubscriptionContext', {
                where: {
                    organization: { id: organizationId },
                    subscriptionPlan: { id_in: group.map(subscriptionContext => subscriptionContext.subscriptionPlan) },
                    status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                    endAt_gt: groupEndAt,
                    deletedAt: null,
                },
            }, { meta: true })
            if (renewedCount > 0) {
                logger.info({ msg: 'bundle already renewed, skipping group', data: { groupContextIds } })
                continue
            }

            const serviceRuleIds = []
            const otherRuleIds = []
            for (const subscriptionContext of group) {
                const plan = await getById('SubscriptionPlan', subscriptionContext.subscriptionPlan)
                if (plan && plan.planType === SUBSCRIPTION_PLAN_TYPE_SERVICE) {
                    serviceRuleIds.push(subscriptionContext.subscriptionPlanPricingRule)
                } else {
                    otherRuleIds.push(subscriptionContext.subscriptionPlanPricingRule)
                }
            }
            const renewalRuleIds = [...serviceRuleIds, ...otherRuleIds]
            if (renewalRuleIds.length === 0) {
                logger.warn({ msg: 'group has no pricing rules, skipping', data: { groupContextIds } })
                continue
            }

            let invoiceId
            let renewalContextIds
            let directPaymentUrl

            const existing = await findExistingRenewalBundle(organizationId, renewalRuleIds)
            if (existing) {
                const invoice = await getById('Invoice', existing.invoiceId)
                if (invoice && invoice.status === INVOICE_STATUS_PAID) {
                    logger.info({ msg: 'renewal already paid, skipping group', data: { organizationId, invoiceId: existing.invoiceId } })
                    continue
                }
                invoiceId = existing.invoiceId
                renewalContextIds = existing.contextIds
                const { directPaymentUrl: rawDirectPaymentUrl } = await registerMultiPayment(context, { invoices: [{ id: invoiceId }], sender: SENDER })
                directPaymentUrl = buildDirectPaymentUrl(rawDirectPaymentUrl, organizationId)
                logger.info({ msg: 'retrying payment for existing renewal bundle', data: { organizationId, invoiceId, renewalContextIds } })
            } else {
                const result = await registerSubscriptionContexts(context, {
                    sender: SENDER,
                    organization: { id: organizationId },
                    subscriptionPlanPricingRules: renewalRuleIds.map(id => ({ id })),
                    paymentType: SUBSCRIPTION_PAYMENT_TYPE_CARD,
                    isTrial: false,
                })
                const newContexts = result.subscriptionContexts || []
                renewalContextIds = newContexts.map(ctx => ctx.id)
                directPaymentUrl = result.directPaymentUrl
                invoiceId = newContexts[0] && newContexts[0].invoice ? newContexts[0].invoice.id : null
                logger.info({ msg: 'registered renewal bundle', data: { organizationId, invoiceId, renewalContextIds } })
            }

            const isLastBufferDay = !dayjs(groupEndAt).isAfter(dayjs(bufferDate))
            const errorStatus = isLastBufferDay ? SUBSCRIPTION_CONTEXT_STATUS.ERROR : SUBSCRIPTION_CONTEXT_STATUS.PENDING

            if (!directPaymentUrl || !invoiceId) {
                logger.warn({ msg: 'no directPaymentUrl or invoice for renewal payment', data: { organizationId, invoiceId } })
                for (const renewalContextId of renewalContextIds) {
                    await SubscriptionContext.update(context, renewalContextId, { dv: 1, sender: SENDER, status: SUBSCRIPTION_CONTEXT_STATUS.ERROR })
                }
                continue
            }

            try {
                const paymentResult = await SubscriptionPaymentAdapter.proceedPayment({
                    directPaymentUrl,
                    cardTokenId: bindingId,
                })
                const { status: paymentStatus, paid, errorMessage, cancellationDetails } = paymentResult

                if (paid) {
                    logger.info({ msg: 'renewal payment succeeded', data: { organizationId, invoiceId } })
                } else {
                    logger.error({ msg: 'renewal payment failed', data: { organizationId, invoiceId, paymentStatus, errorMessage, cancellationDetails, isLastBufferDay, willSetStatus: errorStatus } })
                    for (const renewalContextId of renewalContextIds) {
                        await SubscriptionContext.update(context, renewalContextId, { dv: 1, sender: SENDER, status: errorStatus })
                    }
                }
            } catch (paymentError) {
                logger.error({ msg: 'renewal payment processing error', err: paymentError, data: { organizationId, invoiceId, isLastBufferDay, willSetStatus: errorStatus } })
                for (const renewalContextId of renewalContextIds) {
                    await SubscriptionContext.update(context, renewalContextId, { dv: 1, sender: SENDER, status: errorStatus })
                }
            }
        } catch (error) {
            logger.error({ msg: 'failed to process renewal group', err: error, data: { groupContextIds } })
        }
    }

    logger.info({ msg: 'processing recurrent subscription payments end' })
}

module.exports = {
    processRecurrentSubscriptionPayments,
}
