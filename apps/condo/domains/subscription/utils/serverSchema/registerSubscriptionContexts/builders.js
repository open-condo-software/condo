const dayjs = require('dayjs')

const { GQLError } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')
const { find, getById } = require('@open-condo/keystone/schema')

const { registerMultiPayment } = require('@condo/domains/acquiring/utils/serverSchema')
const { INVOICE_STATUS_PUBLISHED, INVOICE_TYPE_B2B } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')
const { PERIOD_TO_MONTHS, SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_PAYMENT_TYPE_CARD } = require('@condo/domains/subscription/constants')
const { REGISTER_SUBSCRIPTION_CONTEXTS_ERRORS: ERRORS } = require('@condo/domains/subscription/constants/registerSubscriptionContextsErrors')
const { SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')
const { getSubscriptionPaymentRecipient } = require('@condo/domains/subscription/utils/serverSchema/getSubscriptionPaymentRecipient')
const { buildDirectPaymentUrl, pickBaseSubscription } = require('@condo/domains/subscription/utils/serverSchema/registerSubscriptionContexts/helpers')
const { validateUniformPeriod } = require('@condo/domains/subscription/utils/serverSchema/registerSubscriptionContexts/validators')
const { calculateSubscriptionStartDate } = require('@condo/domains/subscription/utils/subscriptionContext')

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

    const subscriptionContexts = await find('SubscriptionContext', { id_in: createdIds, deletedAt: null })
    return { subscriptionContexts, directPaymentUrl: null, multiPayment: null }
}

/**
 * Paid flow: validates the shared period, computes start/end dates aligned after
 * any already active paid subscription, creates one Invoice (a row per rule) and
 * one CREATED SubscriptionContext per rule, and for card payments registers a
 * MultiPayment and builds the direct payment url.
 *
 * Every call registers a fresh Invoice + contexts; it does not look at or touch
 * earlier unpaid registrations.
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

    const activePaidContexts = await find('SubscriptionContext', {
        organization: { id: organization.id },
        subscriptionPlan: { id: baseSubscription.plan.id },
        status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
        deletedAt: null,
    })
    const startAt = calculateSubscriptionStartDate(activePaidContexts)
    const startAtStr = startAt.format('YYYY-MM-DD')
    const endAtStr = startAt.add(months, 'month').format('YYYY-MM-DD')

    const { recipientOrgId: recipientOrganizationId } = await getSubscriptionPaymentRecipient()
    if (!recipientOrganizationId) {
        logger.error({ msg: 'SUBSCRIPTION_PAYMENT_RECIPIENT is not configured' })
        throw new GQLError(ERRORS.PAYMENT_RECIPIENT_NOT_CONFIGURED, context)
    }

    const invoice = await Invoice.create(context, {
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

    const createdIds = []
    for (const { rule, plan } of subscriptions) {
        const created = await SubscriptionContext.create(context, {
            dv,
            sender,
            organization: { connect: { id: organization.id } },
            subscriptionPlan: { connect: { id: plan.id } },
            subscriptionPlanPricingRule: { connect: { id: rule.id } },
            invoice: { connect: { id: invoice.id } },
            startAt: startAtStr,
            endAt: endAtStr,
            isTrial: false,
            status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
            frozenPaymentInfo: { pricingRuleId: rule.id },
        })
        createdIds.push(created.id)
    }

    let directPaymentUrl = null
    let multiPayment = null
    if (isCard) {
        const multiPaymentResult = await registerMultiPayment(context, { invoices: [{ id: invoice.id }], sender })
        directPaymentUrl = buildDirectPaymentUrl(multiPaymentResult.directPaymentUrl, organization.id)
        multiPayment = await getById('MultiPayment', multiPaymentResult.multiPaymentId)
    }

    const subscriptionContexts = await find('SubscriptionContext', { id_in: createdIds, deletedAt: null })
    logger.info({ msg: 'Registered subscription bundle', data: { organizationId: organization.id, invoiceId: invoice.id, contextCount: subscriptionContexts.length, multiPaymentId: multiPayment?.id || null } })

    return { subscriptionContexts, directPaymentUrl, multiPayment }
}

module.exports = {
    createTrialBundle,
    createPaidBundle,
}
