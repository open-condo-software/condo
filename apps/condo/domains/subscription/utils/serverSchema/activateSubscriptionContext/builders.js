const { getLogger } = require('@open-condo/keystone/logging')
const { find, getById, itemsQuery } = require('@open-condo/keystone/schema')

const { PAYMENT_DONE_STATUS } = require('@condo/domains/acquiring/constants/payment')
const { freezePaymentInfo } = require('@condo/domains/acquiring/utils/billingFridge')
const { SUBSCRIPTION_CONTEXT_STATUS } = require('@condo/domains/subscription/constants')
const { SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')
const { computePaidPeriod } = require('@condo/domains/subscription/utils/serverSchema/activateSubscriptionContext/helpers')

const logger = getLogger('ActivateSubscriptionContextService')

/**
 * Resolves the payment method for a paid invoice: finds the latest done Payment,
 * its MultiPayment (if the invoice was paid via acquiring), and freezes the
 * payment info snapshot stored on the subscription context.
 *
 * @returns {Promise<{ multiPayment: object|null, paymentMethod: object|null, bindingId: string|null, frozenPaymentInfo: object }>}
 */
async function resolvePaymentInfo (context, { invoice, subscriptionContext }) {
    const payments = await itemsQuery('Payment', {
        where: {
            invoice: { id: invoice.id, deletedAt: null },
            status: PAYMENT_DONE_STATUS,
            deletedAt: null,
        },
        sortBy: ['createdAt_DESC'],
    })
    const payment = payments[0]

    let multiPayment = null
    if (payment && payment.multiPayment) {
        const [foundMultiPayment] = await find('MultiPayment', {
            id: payment.multiPayment,
            deletedAt: null,
        })
        multiPayment = foundMultiPayment || null
    }
    logger.info({ msg: 'Resolved payment method for invoice', data: { invoiceId: invoice.id, paymentCount: payments.length, multiPaymentId: multiPayment?.id || null } })

    const paymentMethod = multiPayment?.meta?.paymentMethod || null
    const bindingId = paymentMethod?.bindingId || null
    const frozenPaymentInfo = freezePaymentInfo(multiPayment, invoice, subscriptionContext.subscriptionPlanPricingRule)

    return { multiPayment, paymentMethod, bindingId, frozenPaymentInfo }
}

/**
 * Marks a subscription context DONE with the recomputed paid period and the
 * resolved payment method, then returns the updated record.
 *
 * @returns {Promise<object>} the updated SubscriptionContext
 */
async function activatePaidSubscriptionContext (context, { subscriptionContext, bindingId, paymentMethod, frozenPaymentInfo, dv, sender }) {
    const existingDoneContexts = await find('SubscriptionContext', {
        organization: { id: subscriptionContext.organization },
        subscriptionPlan: { id: subscriptionContext.subscriptionPlan },
        status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
        deletedAt: null,
    })
    const { paidStartAt, paidEndAt } = computePaidPeriod(subscriptionContext, existingDoneContexts)

    logger.info({ msg: 'Updating subscription context', data: { subscriptionContextId: subscriptionContext.id, bindingId, hasPaymentMethod: !!paymentMethod, startAt: paidStartAt.format('YYYY-MM-DD'), endAt: paidEndAt.format('YYYY-MM-DD') } })

    await SubscriptionContext.update(context, subscriptionContext.id, {
        dv,
        sender,
        status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
        startAt: paidStartAt.format('YYYY-MM-DD'),
        endAt: paidEndAt.format('YYYY-MM-DD'),
        bindingId,
        frozenPaymentInfo,
    })

    const updatedSubscriptionContext = await getById('SubscriptionContext', subscriptionContext.id)
    logger.info({ msg: 'Subscription context activated successfully', data: { subscriptionContextId: subscriptionContext.id, status: updatedSubscriptionContext.status, bindingId: updatedSubscriptionContext.bindingId } })

    return updatedSubscriptionContext
}

module.exports = {
    resolvePaymentInfo,
    activatePaidSubscriptionContext,
}
