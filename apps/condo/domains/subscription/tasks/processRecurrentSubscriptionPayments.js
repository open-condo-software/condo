const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById, itemsQuery } = require('@open-condo/keystone/schema')

const { SUBSCRIPTION_PAYMENT_BUFFER_DAYS, SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_PLAN_TYPE_SERVICE } = require('@condo/domains/subscription/constants')
const { SubscriptionPaymentAdapter } = require('@condo/domains/subscription/tasks/utils/SubscriptionPaymentAdapter')
const { registerSubscriptionContexts, SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')

const logger = getLogger('processRecurrentSubscriptionPayments')

const SENDER = { dv: 1, fingerprint: 'processRecurrentSubscriptionPayments' }

function groupContextsByInvoice (contexts) {
    const groups = new Map()
    for (const subscriptionContext of contexts) {
        const key = subscriptionContext.invoice || `no-invoice:${subscriptionContext.id}`
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(subscriptionContext)
    }
    return Array.from(groups.values())
}

async function isLatestDoneContext (subscriptionContext) {
    const [latest] = await itemsQuery('SubscriptionContext', {
        where: {
            organization: { id: subscriptionContext.organization },
            subscriptionPlan: { id: subscriptionContext.subscriptionPlan },
            status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
            deletedAt: null,
        },
        sortBy: ['endAt_DESC'],
        first: 1,
    })
    return latest && latest.id === subscriptionContext.id
}

async function resolveRenewalRuleIds (group) {
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
    return [...serviceRuleIds, ...otherRuleIds]
}

async function processGroup (context, group, bufferDate) {
    const organizationId = group[0].organization
    const bindingId = group[0].bindingId
    const groupContextIds = group.map(subscriptionContext => subscriptionContext.id)

    for (const subscriptionContext of group) {
        const isLatest = await isLatestDoneContext(subscriptionContext)
        if (!isLatest) {
            logger.info({ msg: 'group has a non-latest context, skipping group', data: { subscriptionContextId: subscriptionContext.id, groupContextIds } })
            return
        }
    }

    const renewalRuleIds = await resolveRenewalRuleIds(group)
    if (renewalRuleIds.length === 0) {
        logger.warn({ msg: 'group has no pricing rules, skipping', data: { groupContextIds } })
        return
    }

    const result = await registerSubscriptionContexts(context, {
        sender: SENDER,
        organization: { id: organizationId },
        subscriptionPlanPricingRules: renewalRuleIds.map(id => ({ id })),
        isTrial: false,
    })

    const newContexts = result.subscriptionContexts || []
    const directPaymentUrl = result.directPaymentUrl
    const invoiceId = newContexts[0] && newContexts[0].invoice ? newContexts[0].invoice.id : null

    logger.info({ msg: 'registered renewal bundle', data: { organizationId, invoiceId, newContextIds: newContexts.map(ctx => ctx.id) } })

    const setStatusForAll = async (status) => {
        for (const newContext of newContexts) {
            await SubscriptionContext.update(context, newContext.id, { dv: 1, sender: SENDER, status })
        }
    }

    if (!directPaymentUrl || !invoiceId) {
        logger.warn({ msg: 'no directPaymentUrl or invoice for renewal payment', data: { organizationId, invoiceId } })
        await setStatusForAll(SUBSCRIPTION_CONTEXT_STATUS.ERROR)
        return
    }

    const groupEndAt = group.reduce((min, subscriptionContext) => (!min || subscriptionContext.endAt < min ? subscriptionContext.endAt : min), null)
    const isLastBufferDay = !dayjs(groupEndAt).isAfter(dayjs(bufferDate))
    const errorStatus = isLastBufferDay ? SUBSCRIPTION_CONTEXT_STATUS.ERROR : SUBSCRIPTION_CONTEXT_STATUS.PENDING

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
            await setStatusForAll(errorStatus)
        }
    } catch (paymentError) {
        logger.error({ msg: 'renewal payment processing error', err: paymentError, data: { organizationId, invoiceId, isLastBufferDay, willSetStatus: errorStatus } })
        await setStatusForAll(errorStatus)
    }
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

    const groups = groupContextsByInvoice(contexts)
    logger.info({ msg: 'found subscription contexts to renew', count: contexts.length, groupCount: groups.length })

    for (const group of groups) {
        try {
            await processGroup(context, group, bufferDate)
        } catch (error) {
            logger.error({ msg: 'failed to process renewal group', err: error, data: { groupContextIds: group.map(subscriptionContext => subscriptionContext.id) } })
        }
    }

    logger.info({ msg: 'processing recurrent subscription payments end' })
}

module.exports = {
    processRecurrentSubscriptionPayments,
}
