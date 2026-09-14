const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, find, itemsQuery } = require('@open-condo/keystone/schema')

const { registerMultiPayment } = require('@condo/domains/acquiring/utils/serverSchema')
const { INVOICE_STATUS_PUBLISHED } = require('@condo/domains/marketplace/constants')
const { SUBSCRIPTION_PAYMENT_BUFFER_DAYS, SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_PLAN_TYPE_SERVICE, SUBSCRIPTION_PAYMENT_TYPE_CARD } = require('@condo/domains/subscription/constants')
const { SubscriptionPaymentAdapter } = require('@condo/domains/subscription/tasks/utils/SubscriptionPaymentAdapter')
const { registerSubscriptionContexts, SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')
const { buildDirectPaymentUrl } = require('@condo/domains/subscription/utils/subscriptionContext')

const logger = getLogger('processRecurrentSubscriptionPayments')

const SENDER = { dv: 1, fingerprint: 'processRecurrentSubscriptionPayments' }

// Renewed together means expiring together, not paid together: one invoice can cover periods that
// end on different days, and only what ends on the same day can share a renewal charge. Grouping
// stays inside an invoice so a renewal never invents a bundle the organization never bought
function groupContextsIntoRenewalBundles (contexts) {
    const bundles = new Map()

    for (const subscriptionContext of contexts) {
        const { organization, invoice, endAt, bindingId, id } = subscriptionContext
        const key = [organization, invoice || `standalone:${id}`, endAt, bindingId].join('|')
        if (!bundles.has(key)) bundles.set(key, { invoiceId: invoice || null, contexts: [] })
        bundles.get(key).contexts.push(subscriptionContext)
    }

    return [...bundles.values()]
}

// Finds a renewal a previous run already registered, so a failed charge is retried on the existing
// invoice instead of billing the organization twice. CREATED covers a run that died before paying
async function findExistingRenewalBundle (organizationId, renewalRuleIds, bufferDate) {
    const wantedComposition = [...renewalRuleIds].sort().join(',')

    const contexts = await itemsQuery('SubscriptionContext', {
        where: {
            organization: { id: organizationId },
            status_in: [SUBSCRIPTION_CONTEXT_STATUS.CREATED, SUBSCRIPTION_CONTEXT_STATUS.PENDING],
            isTrial: false,
            createdAt_gte: dayjs(bufferDate).toISOString(),
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

async function getBundleRenewalState (bundle) {
    const planIds = bundle.contexts.map(subscriptionContext => subscriptionContext.subscriptionPlan)

    const successorContexts = await itemsQuery('SubscriptionContext', {
        where: {
            organization: { id: bundle.contexts[0].organization },
            subscriptionPlan: { id_in: planIds },
            status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
            endAt_gt: bundle.contexts[0].endAt,
            deletedAt: null,
        },
    })

    const renewedPlanIds = new Set(successorContexts.map(subscriptionContext => subscriptionContext.subscriptionPlan))
    const renewedCount = planIds.filter(planId => renewedPlanIds.has(planId)).length

    if (renewedCount === 0) return 'NOT_RENEWED'
    if (renewedCount === planIds.length) return 'RENEWED'
    return 'PARTIALLY_RENEWED'
}

async function collectRenewalRuleIds (bundle) {
    const serviceRuleIds = []
    const featureRuleIds = []

    for (const subscriptionContext of bundle.contexts) {
        if (!subscriptionContext.subscriptionPlanPricingRule) continue

        const [plan] = await find('SubscriptionPlan', { id: subscriptionContext.subscriptionPlan, deletedAt: null })
        if (plan && plan.planType === SUBSCRIPTION_PLAN_TYPE_SERVICE) {
            serviceRuleIds.push(subscriptionContext.subscriptionPlanPricingRule)
        } else {
            featureRuleIds.push(subscriptionContext.subscriptionPlanPricingRule)
        }
    }

    return [...serviceRuleIds, ...featureRuleIds]
}

async function setContextsStatus (context, contextIds, status) {
    for (const contextId of contextIds) {
        await SubscriptionContext.update(context, contextId, { dv: 1, sender: SENDER, status })
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

    const renewalBundles = groupContextsIntoRenewalBundles(contexts)

    logger.info({ msg: 'found subscription contexts to renew', count: contexts.length, bundleCount: renewalBundles.length })

    for (const bundle of renewalBundles) {
        const organizationId = bundle.contexts[0].organization
        const bindingId = bundle.contexts[0].bindingId
        const bundleEndAt = bundle.contexts[0].endAt
        const bundleContextIds = bundle.contexts.map(subscriptionContext => subscriptionContext.id)

        try {
            const renewalState = await getBundleRenewalState(bundle)
            if (renewalState === 'RENEWED') {
                logger.info({ msg: 'bundle already renewed, skipping', data: { bundleContextIds } })
                continue
            }
            if (renewalState === 'PARTIALLY_RENEWED') {
                logger.error({ msg: 'bundle is partially renewed, skipping', data: { bundleContextIds, invoiceId: bundle.invoiceId } })
                continue
            }

            const renewalRuleIds = await collectRenewalRuleIds(bundle)
            if (renewalRuleIds.length !== bundle.contexts.length) {
                logger.error({ msg: 'bundle has contexts without a pricing rule, skipping', data: { bundleContextIds, renewalRuleIds } })
                continue
            }

            let invoiceId
            let renewalContextIds
            let directPaymentUrl

            const existing = await findExistingRenewalBundle(organizationId, renewalRuleIds, bufferDate)
            if (existing) {
                const [invoice] = await find('Invoice', { id: existing.invoiceId, deletedAt: null })
                if (!invoice || invoice.status !== INVOICE_STATUS_PUBLISHED) {
                    logger.info({ msg: 'existing renewal invoice is not payable, skipping', data: { organizationId, invoiceId: existing.invoiceId, invoiceStatus: invoice?.status || null } })
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

            const isLastBufferDay = !dayjs(bundleEndAt).isAfter(dayjs(bufferDate))
            const errorStatus = isLastBufferDay ? SUBSCRIPTION_CONTEXT_STATUS.ERROR : SUBSCRIPTION_CONTEXT_STATUS.PENDING

            if (!directPaymentUrl || !invoiceId) {
                logger.warn({ msg: 'no directPaymentUrl or invoice for renewal payment', data: { organizationId, invoiceId } })
                await setContextsStatus(context, renewalContextIds, SUBSCRIPTION_CONTEXT_STATUS.ERROR)
                continue
            }

            try {
                const paymentResult = await SubscriptionPaymentAdapter.proceedPayment({
                    directPaymentUrl,
                    cardTokenId: bindingId,
                })
                const { status: paymentStatus, paid, errorMessage, cancellationDetails } = paymentResult

                if (paid) {
                    // Findable until the acquiring callback lands, so the next run retries this invoice
                    // instead of registering another one and charging the card twice
                    await setContextsStatus(context, renewalContextIds, SUBSCRIPTION_CONTEXT_STATUS.PENDING)
                    logger.info({ msg: 'renewal payment succeeded', data: { organizationId, invoiceId, renewalContextIds } })
                } else {
                    logger.error({ msg: 'renewal payment failed', data: { organizationId, invoiceId, paymentStatus, errorMessage, cancellationDetails, isLastBufferDay, willSetStatus: errorStatus } })
                    await setContextsStatus(context, renewalContextIds, errorStatus)
                }
            } catch (paymentError) {
                logger.error({ msg: 'renewal payment processing error', err: paymentError, data: { organizationId, invoiceId, isLastBufferDay, willSetStatus: errorStatus } })
                await setContextsStatus(context, renewalContextIds, errorStatus)
            }
        } catch (error) {
            logger.error({ msg: 'failed to process renewal bundle', err: error, data: { bundleContextIds } })
        }
    }

    logger.info({ msg: 'processing recurrent subscription payments end' })
}

module.exports = {
    processRecurrentSubscriptionPayments,
}
