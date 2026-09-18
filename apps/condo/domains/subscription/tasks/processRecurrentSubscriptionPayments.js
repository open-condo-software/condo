const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, find, itemsQuery } = require('@open-condo/keystone/schema')

const { DIRECT_PAYMENT_PATH } = require('@condo/domains/acquiring/constants/links')
const {
    MULTIPAYMENT_DONE_STATUS,
    MULTIPAYMENT_INIT_STATUS,
    MULTIPAYMENT_PROCESSING_STATUS,
    MULTIPAYMENT_WITHDRAWN_STATUS,
    PAYMENT_DONE_STATUS,
    PAYMENT_PROCESSING_STATUS,
    PAYMENT_WITHDRAWN_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const { registerMultiPayment } = require('@condo/domains/acquiring/utils/serverSchema')
const { INVOICE_STATUS_CANCELED, INVOICE_STATUS_PUBLISHED } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')
const {
    SUBSCRIPTION_PAYMENT_BUFFER_DAYS,
    SUBSCRIPTION_INVOICE_PAYMENT_DAYS,
    SUBSCRIPTION_CONTEXT_STATUS,
    SUBSCRIPTION_PAYMENT_TYPE_CARD,
    SUBSCRIPTION_PAYMENT_TYPE_INVOICE,
} = require('@condo/domains/subscription/constants')
const { SubscriptionPaymentAdapter } = require('@condo/domains/subscription/tasks/utils/SubscriptionPaymentAdapter')
const { registerSubscriptionContexts, SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')
const { getSubscriptionPaymentRecipient } = require('@condo/domains/subscription/utils/serverSchema/getSubscriptionPaymentRecipient')
const { buildDirectPaymentUrl } = require('@condo/domains/subscription/utils/subscriptionContext')

const logger = getLogger('processRecurrentSubscriptionPayments')

const SENDER = { dv: 1, fingerprint: 'processRecurrentSubscriptionPayments' }
const PAYMENT_STARTED_STATUSES = [PAYMENT_PROCESSING_STATUS, PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS]
const MULTIPAYMENT_STARTED_STATUSES = [MULTIPAYMENT_PROCESSING_STATUS, MULTIPAYMENT_WITHDRAWN_STATUS, MULTIPAYMENT_DONE_STATUS]

function groupContextsIntoRenewalBundles (contexts) {
    const bundles = new Map()

    for (const subscriptionContext of contexts) {
        const { organization, invoice, endAt, bindingId, id } = subscriptionContext
        const key = [organization, invoice || `standalone:${id}`, endAt, bindingId].join('|')
        if (!bundles.has(key)) bundles.set(key, [])
        bundles.get(key).push(subscriptionContext)
    }

    return [...bundles.values()]
}

async function filterNotRenewedContexts (bundleContexts) {
    const successorContexts = await find('SubscriptionContext', {
        organization: { id: bundleContexts[0].organization },
        subscriptionPlan: { id_in: bundleContexts.map(subscriptionContext => subscriptionContext.subscriptionPlan) },
        status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
        isTrial: false,
        endAt_gt: bundleContexts[0].endAt,
        deletedAt: null,
    })
    const renewedPlanIds = new Set(successorContexts.map(subscriptionContext => subscriptionContext.subscriptionPlan))
    return bundleContexts.filter(subscriptionContext => !renewedPlanIds.has(subscriptionContext.subscriptionPlan))
}

// Finds a renewal registered earlier in the buffer window and tells whether it may be charged
async function findExistingRenewal (context, organizationId, renewalRuleIds, bufferDate) {
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

    const contextsByInvoice = new Map()
    for (const subscriptionContext of contexts) {
        if (!subscriptionContext.invoice) continue
        if (!contextsByInvoice.has(subscriptionContext.invoice)) contextsByInvoice.set(subscriptionContext.invoice, [])
        contextsByInvoice.get(subscriptionContext.invoice).push(subscriptionContext)
    }

    for (const [invoiceId, invoiceContexts] of contextsByInvoice) {
        const composition = invoiceContexts.map(subscriptionContext => subscriptionContext.subscriptionPlanPricingRule).sort().join(',')
        if (composition !== wantedComposition) continue

        const renewal = { invoiceId, contextIds: invoiceContexts.map(subscriptionContext => subscriptionContext.id) }

        const [invoice] = await find('Invoice', { id: invoiceId, deletedAt: null })
        // A renewal whose invoice is gone can never be paid: close it so a new one gets registered
        if (!invoice || invoice.status === INVOICE_STATUS_CANCELED) {
            await setContextsStatus(context, renewal.contextIds, SUBSCRIPTION_CONTEXT_STATUS.ERROR)
            continue
        }

        const payments = await find('Payment', { invoice: { id: invoiceId }, deletedAt: null })
        // No payments means the invoice was registered to be paid by bank transfer: charging the card would take the money twice
        if (payments.length === 0) return { ...renewal, skipReason: 'PAID_BY_TRANSFER' }
        // The gateway moves only the MultiPayment to PROCESSING when it charges; payments turn DONE later, from the provider webhook.
        // Either one started means the money may already be taken
        const multiPaymentIds = [...new Set(payments.map(payment => payment.multiPayment).filter(Boolean))]
        const multiPayments = multiPaymentIds.length > 0 ? await find('MultiPayment', { id_in: multiPaymentIds, deletedAt: null }) : []
        const isPaymentStarted = payments.some(payment => PAYMENT_STARTED_STATUSES.includes(payment.status))
            || multiPayments.some(multiPayment => MULTIPAYMENT_STARTED_STATUSES.includes(multiPayment.status))
        if (isPaymentStarted) return { ...renewal, skipReason: 'PAYMENT_STARTED' }

        if (invoice.status !== INVOICE_STATUS_PUBLISHED) return { ...renewal, skipReason: 'INVOICE_NOT_PAYABLE' }

        const unchargedMultiPayment = multiPayments.find(multiPayment => multiPayment.status === MULTIPAYMENT_INIT_STATUS)
        return { ...renewal, skipReason: null, multiPaymentId: unchargedMultiPayment?.id || null }
    }

    return null
}

// MultiPayment id is the provider idempotency key: reusing an uncharged one cannot charge twice, a new one can
async function getRetryPaymentUrl (context, { invoiceId, multiPaymentId }) {
    if (multiPaymentId) {
        const { acquiringIntegration } = await getSubscriptionPaymentRecipient()
        if (acquiringIntegration?.hostUrl) {
            return `${acquiringIntegration.hostUrl}${DIRECT_PAYMENT_PATH.replace('[id]', multiPaymentId)}`
        }
    }
    const { directPaymentUrl } = await registerMultiPayment(context, { invoices: [{ id: invoiceId }], sender: SENDER })
    return directPaymentUrl
}

// Returns the invoice, contexts and payment url to charge, or null when the bundle must not be charged
async function prepareRenewalPayment (context, { organizationId, renewalRuleIds, bufferDate }) {
    const existing = await findExistingRenewal(context, organizationId, renewalRuleIds, bufferDate)

    if (existing && existing.skipReason) {
        logger.info({ msg: 'existing renewal must not be charged, skipping', data: { organizationId, invoiceId: existing.invoiceId, skipReason: existing.skipReason } })
        return null
    }

    if (existing) {
        const directPaymentUrl = await getRetryPaymentUrl(context, existing)
        logger.info({ msg: 'retrying payment for existing renewal', data: { organizationId, invoiceId: existing.invoiceId, contextIds: existing.contextIds, multiPaymentId: existing.multiPaymentId } })
        return { ...existing, directPaymentUrl: buildDirectPaymentUrl(directPaymentUrl, organizationId) }
    }

    const { subscriptionContexts = [], directPaymentUrl } = await registerSubscriptionContexts(context, {
        sender: SENDER,
        organization: { id: organizationId },
        subscriptionPlanPricingRules: renewalRuleIds.map(id => ({ id })),
        paymentType: SUBSCRIPTION_PAYMENT_TYPE_CARD,
        isTrial: false,
    })
    const renewal = {
        invoiceId: subscriptionContexts[0]?.invoice?.id || null,
        contextIds: subscriptionContexts.map(subscriptionContext => subscriptionContext.id),
        directPaymentUrl,
    }
    logger.info({ msg: 'registered renewal', data: { organizationId, invoiceId: renewal.invoiceId, contextIds: renewal.contextIds } })
    return renewal
}

async function chargeRenewal ({ invoiceId, directPaymentUrl }, bindingId, logData) {
    if (!invoiceId || !directPaymentUrl) {
        logger.warn({ msg: 'no directPaymentUrl or invoice for renewal payment', data: logData })
        return false
    }

    try {
        const { paid, status, errorMessage, cancellationDetails } = await SubscriptionPaymentAdapter.proceedPayment({ directPaymentUrl, cardTokenId: bindingId })
        if (!paid) logger.error({ msg: 'renewal payment failed', data: { ...logData, paymentStatus: status, errorMessage, cancellationDetails } })
        return paid
    } catch (err) {
        logger.error({ msg: 'renewal payment processing error', err, data: logData })
        return false
    }
}

async function setContextsStatus (context, contextIds, status) {
    for (const contextId of contextIds) {
        await SubscriptionContext.update(context, contextId, { dv: 1, sender: SENDER, status })
    }
}

// Invoice is cancelled first: ERROR contexts can never be activated by a later payment
async function failRenewal (context, { contextIds, invoiceId }, status) {
    if (status === SUBSCRIPTION_CONTEXT_STATUS.ERROR && invoiceId) {
        try {
            await Invoice.update(context, invoiceId, { dv: 1, sender: SENDER, status: INVOICE_STATUS_CANCELED })
        } catch (err) {
            logger.error({ msg: 'failed to cancel invoice of a failed renewal, contexts keep their status', err, data: { invoiceId, contextIds } })
            return
        }
    }
    await setContextsStatus(context, contextIds, status)
}

/**
 * A period with any later context of the same plan is taken care of already: it was renewed, a renewal waits
 * for its payment or its invoice expired. A new invoice after an expired one is asked for by the organization itself
 */
async function filterNotYetRenewedContexts (bundleContexts) {
    const successorContexts = await find('SubscriptionContext', {
        organization: { id: bundleContexts[0].organization },
        subscriptionPlan: { id_in: bundleContexts.map(subscriptionContext => subscriptionContext.subscriptionPlan) },
        isTrial: false,
        endAt_gt: bundleContexts[0].endAt,
        deletedAt: null,
    })
    const renewedPlanIds = new Set(successorContexts.map(subscriptionContext => subscriptionContext.subscriptionPlan))
    return bundleContexts.filter(subscriptionContext => !renewedPlanIds.has(subscriptionContext.subscriptionPlan))
}

/**
 * Nothing charges an organization that pays by invoice, so the invoice for its next period is issued when the current
 * one is about to end, leaving it the usual days to pay. Registering it by invoice sends the sales team the same
 * request as a manual one. Trials, periods without a price and the ones the organization removed from its
 * subscription are never renewed
 */
async function issueRenewalInvoices (context) {
    const today = dayjs().format('YYYY-MM-DD')
    const issueUntil = dayjs().add(SUBSCRIPTION_INVOICE_PAYMENT_DAYS, 'days').format('YYYY-MM-DD')

    const contexts = await itemsQuery('SubscriptionContext', {
        where: {
            bindingId: null,
            renewalCancelledAt: null,
            isTrial: false,
            status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
            invoice_is_null: false,
            subscriptionPlanPricingRule_is_null: false,
            endAt_gte: today,
            endAt_lte: issueUntil,
            deletedAt: null,
        },
        sortBy: ['endAt_ASC'],
    })
    // a card payment without a saved card cannot renew by itself either, but the organization chose the card, not an invoice
    const paidByInvoice = contexts.filter(subscriptionContext => subscriptionContext.frozenPaymentInfo?.paymentType !== SUBSCRIPTION_PAYMENT_TYPE_CARD)

    const renewalBundles = groupContextsIntoRenewalBundles(paidByInvoice)
    logger.info({ msg: 'found subscription contexts to issue renewal invoices for', count: paidByInvoice.length, bundleCount: renewalBundles.length, data: { today, issueUntil } })

    for (const bundleContexts of renewalBundles) {
        const organizationId = bundleContexts[0].organization
        const bundleContextIds = bundleContexts.map(subscriptionContext => subscriptionContext.id)

        try {
            const contextsToRenew = await filterNotYetRenewedContexts(bundleContexts)
            if (contextsToRenew.length === 0) continue

            const rules = await find('SubscriptionPlanPricingRule', {
                id_in: contextsToRenew.map(subscriptionContext => subscriptionContext.subscriptionPlanPricingRule),
                deletedAt: null,
            })
            // a free period has nothing to invoice
            const paidRules = rules.filter(rule => rule.price !== null && Number(rule.price) > 0)
            if (paidRules.length === 0) continue

            const { subscriptionContexts = [] } = await registerSubscriptionContexts(context, {
                sender: SENDER,
                organization: { id: organizationId },
                subscriptionPlanPricingRules: paidRules.map(rule => ({ id: rule.id })),
                paymentType: SUBSCRIPTION_PAYMENT_TYPE_INVOICE,
                isTrial: false,
            })
            logger.info({ msg: 'issued renewal invoice', data: { organizationId, bundleContextIds, contextIds: subscriptionContexts.map(({ id }) => id) } })
        } catch (err) {
            logger.error({ msg: 'failed to issue renewal invoice', err, data: { organizationId, bundleContextIds } })
        }
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

    for (const bundleContexts of renewalBundles) {
        const { organization: organizationId, bindingId, endAt } = bundleContexts[0]
        const bundleContextIds = bundleContexts.map(subscriptionContext => subscriptionContext.id)

        try {
            const contextsToRenew = await filterNotRenewedContexts(bundleContexts)
            if (contextsToRenew.length === 0) {
                logger.info({ msg: 'bundle already renewed, skipping', data: { organizationId, bundleContextIds } })
                continue
            }

            const renewalRuleIds = contextsToRenew.map(subscriptionContext => subscriptionContext.subscriptionPlanPricingRule)
            if (renewalRuleIds.some(ruleId => !ruleId)) {
                logger.error({ msg: 'bundle has contexts without a pricing rule, skipping', data: { organizationId, bundleContextIds } })
                continue
            }

            const renewal = await prepareRenewalPayment(context, { organizationId, renewalRuleIds, bufferDate })
            if (!renewal) continue

            const logData = { organizationId, invoiceId: renewal.invoiceId, contextIds: renewal.contextIds }
            const paid = await chargeRenewal(renewal, bindingId, logData)

            if (paid) {
                logger.info({ msg: 'renewal payment succeeded', data: logData })
                continue
            }

            const isLastBufferDay = !dayjs(endAt).isAfter(dayjs(bufferDate))
            const failureStatus = isLastBufferDay ? SUBSCRIPTION_CONTEXT_STATUS.ERROR : SUBSCRIPTION_CONTEXT_STATUS.PENDING
            logger.warn({ msg: 'renewal is not paid', data: { ...logData, isLastBufferDay, willSetStatus: failureStatus } })
            await failRenewal(context, renewal, failureStatus)
        } catch (err) {
            logger.error({ msg: 'failed to process renewal bundle', err, data: { organizationId, bundleContextIds } })
        }
    }

    await issueRenewalInvoices(context)

    logger.info({ msg: 'processing recurrent subscription payments end' })
}

module.exports = {
    processRecurrentSubscriptionPayments,
}
