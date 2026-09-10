const dayjs = require('dayjs')

const { GQLError } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')
const { find, getById } = require('@open-condo/keystone/schema')

const { registerMultiPayment } = require('@condo/domains/acquiring/utils/serverSchema')
const { INVOICE_STATUS_PUBLISHED, INVOICE_STATUS_CANCELED, INVOICE_TYPE_B2B } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')
const { PERIOD_TO_MONTHS, SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_PAYMENT_TYPE_CARD } = require('@condo/domains/subscription/constants')
const { REGISTER_SUBSCRIPTION_CONTEXTS_ERRORS: ERRORS } = require('@condo/domains/subscription/constants/registerSubscriptionContextsErrors')
const { SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')
const { getSubscriptionPaymentRecipient } = require('@condo/domains/subscription/utils/serverSchema/getSubscriptionPaymentRecipient')
const { buildDirectPaymentUrl, pickBaseSubscription, isSameComposition } = require('@condo/domains/subscription/utils/serverSchema/registerSubscriptionContexts/helpers')
const { validateUniformPeriod } = require('@condo/domains/subscription/utils/serverSchema/registerSubscriptionContexts/validators')
const { calculateSubscriptionStartDate, findBundleContexts } = require('@condo/domains/subscription/utils/subscriptionContext')

const logger = getLogger('RegisterSubscriptionContextsService')

/**
 * Trial flow: for every requested subscription whose trial is available (own
 * trialDays > 0 and not already used) creates a status DONE SubscriptionContext.
 * Throws TRIAL_ALREADY_USED / TRIAL_NOT_AVAILABLE when no plan is eligible.
 *
 * @returns {Promise<{ subscriptionContexts: Array, directPaymentUrl: null, multiPayment: null }>}
 */
async function createTrialBundle (context, { subscriptions, organization, dv, sender }) {
    const trialSubscriptions = []
    let anyTrialAlreadyUsed = false
    for (const subscription of subscriptions) {
        if (subscription.plan.trialDays <= 0) continue
        const [existingTrial] = await find('SubscriptionContext', {
            organization: { id: organization.id },
            subscriptionPlan: { id: subscription.plan.id },
            isTrial: true,
            deletedAt: null,
        })
        if (existingTrial) {
            anyTrialAlreadyUsed = true
            continue
        }
        trialSubscriptions.push(subscription)
    }
    if (trialSubscriptions.length === 0) {
        throw new GQLError(anyTrialAlreadyUsed ? ERRORS.TRIAL_ALREADY_USED : ERRORS.TRIAL_NOT_AVAILABLE, context)
    }

    const trialStartAt = dayjs()
    const createdIds = []
    for (const { plan } of trialSubscriptions) {
        const created = await SubscriptionContext.create(context, {
            dv,
            sender,
            organization: { connect: { id: organization.id } },
            subscriptionPlan: { connect: { id: plan.id } },
            startAt: trialStartAt.format('YYYY-MM-DD'),
            endAt: trialStartAt.add(plan.trialDays, 'day').format('YYYY-MM-DD'),
            isTrial: true,
            status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
        })
        createdIds.push(created.id)
    }

    // re-read through the adapter so the mutation returns the internal item shape
    const subscriptionContexts = await find('SubscriptionContext', { id_in: createdIds, deletedAt: null })
    return { subscriptionContexts, directPaymentUrl: null, multiPayment: null }
}

/**
 * Paid flow: validates the shared period, computes aligned start/end dates,
 * reuses an existing unpaid bundle of the same composition or supersedes one
 * whose composition changed, creates one Invoice (a row per rule) and one
 * CREATED SubscriptionContext per rule, and for card payments registers a
 * MultiPayment and builds the direct payment url.
 *
 * @returns {Promise<{ subscriptionContexts: Array, directPaymentUrl: string|null, multiPayment: object|null }>}
 */
async function createPaidBundle (context, { subscriptions, organization, paymentType, dv, sender }) {
    const isCard = paymentType === SUBSCRIPTION_PAYMENT_TYPE_CARD

    const baseSubscription = pickBaseSubscription(subscriptions)
    validateUniformPeriod(subscriptions, baseSubscription.rule, context)
    const months = PERIOD_TO_MONTHS[baseSubscription.rule.period]
    if (!months) {
        throw new GQLError(ERRORS.PRICING_RULE_NOT_FOUND, context)
    }

    const basePlan = baseSubscription.plan
    const basePricingRule = baseSubscription.rule

    const existingContexts = await find('SubscriptionContext', {
        organization: { id: organization.id },
        subscriptionPlan: { id: basePlan.id },
        status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
        deletedAt: null,
    })
    const startAt = calculateSubscriptionStartDate(existingContexts)
    const endAt = startAt.add(months, 'month')
    const startAtStr = startAt.format('YYYY-MM-DD')
    const endAtStr = endAt.format('YYYY-MM-DD')

    const requestedRuleIds = subscriptions.map(subscription => subscription.rule.id).sort()

    const unpaidStatuses = isCard
        ? [SUBSCRIPTION_CONTEXT_STATUS.CREATED, SUBSCRIPTION_CONTEXT_STATUS.PENDING]
        : [SUBSCRIPTION_CONTEXT_STATUS.CREATED]
    const [priorContext] = await find('SubscriptionContext', {
        organization: { id: organization.id },
        subscriptionPlanPricingRule: { id: basePricingRule.id },
        startAt: startAtStr,
        status_in: unpaidStatuses,
        deletedAt: null,
    })

    let invoiceId = null
    let bundleContextIds = null

    if (priorContext && priorContext.invoice) {
        const priorBundle = await findBundleContexts(priorContext.invoice, unpaidStatuses)
        if (isSameComposition(priorBundle, requestedRuleIds)) {
            logger.info({ msg: 'Reusing existing bundle', data: { invoiceId: priorContext.invoice } })
            invoiceId = priorContext.invoice
            bundleContextIds = priorBundle.map(ctx => ctx.id)
        } else {
            logger.info({ msg: 'Superseding existing bundle with changed composition', data: { invoiceId: priorContext.invoice } })
            for (const ctx of priorBundle) {
                await SubscriptionContext.update(context, ctx.id, { dv, sender, deletedAt: new Date().toISOString() })
            }
            await Invoice.update(context, priorContext.invoice, { dv, sender, status: INVOICE_STATUS_CANCELED })
        }
    }

    if (!invoiceId) {
        const { recipientOrgId: recipientOrganizationId } = await getSubscriptionPaymentRecipient()
        if (!recipientOrganizationId) {
            logger.error({ msg: 'SUBSCRIPTION_PAYMENT_RECIPIENT is not configured' })
            throw new GQLError(ERRORS.PAYMENT_RECIPIENT_NOT_CONFIGURED, context)
        }

        const createdInvoice = await Invoice.create(context, {
            dv,
            sender,
            organization: { connect: { id: recipientOrganizationId } },
            type: INVOICE_TYPE_B2B,
            payerOrganization: { connect: { id: organization.id } },
            status: INVOICE_STATUS_PUBLISHED,
            rows: subscriptions.map(({ rule, plan }) => ({
                name: plan.name,
                count: 1,
                toPay: rule.price,
                isMin: false,
            })),
        })
        invoiceId = createdInvoice.id

        bundleContextIds = []
        for (const { rule, plan } of subscriptions) {
            const created = await SubscriptionContext.create(context, {
                dv,
                sender,
                organization: { connect: { id: organization.id } },
                subscriptionPlan: { connect: { id: plan.id } },
                subscriptionPlanPricingRule: { connect: { id: rule.id } },
                invoice: { connect: { id: invoiceId } },
                startAt: startAtStr,
                endAt: endAtStr,
                isTrial: false,
                status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
                frozenPaymentInfo: { pricingRuleId: rule.id },
            })
            bundleContextIds.push(created.id)
        }
    }

    let directPaymentUrl = null
    let multiPayment = null
    if (isCard) {
        const multiPaymentResult = await registerMultiPayment(context, { invoices: [{ id: invoiceId }], sender })
        directPaymentUrl = buildDirectPaymentUrl(multiPaymentResult.directPaymentUrl, organization.id)
        multiPayment = await getById('MultiPayment', multiPaymentResult.multiPaymentId)
    }

    // re-read through the adapter so the mutation returns the internal item shape
    const subscriptionContexts = await find('SubscriptionContext', { id_in: bundleContextIds, deletedAt: null })
    logger.info({ msg: 'Registered subscription bundle', data: { organizationId: organization.id, invoiceId, contextCount: subscriptionContexts.length, multiPaymentId: multiPayment?.id || null } })

    return { subscriptionContexts, directPaymentUrl, multiPayment }
}

module.exports = {
    createTrialBundle,
    createPaidBundle,
}
